#include <jni.h>
#include <android/log.h>

#include <cstdint>
#include <cstring>
#include <cstdlib>
#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

extern "C" {
#include "quickjs.h"
}

namespace {

constexpr const char* kLogTag = "WalletKitQuickJs";
const jint kRequiredJniVersion = JNI_VERSION_1_6;

#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, kLogTag, __VA_ARGS__)
#define LOGW(...) __android_log_print(ANDROID_LOG_WARN, kLogTag, __VA_ARGS__)
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, kLogTag, __VA_ARGS__)

enum class ValueKind {
    kVoid,
    kString,
    kBoolean,
    kInt,
    kLong,
    kDouble,
};

struct JavaRefs {
    jclass methodClass = nullptr;
    jmethodID methodInvoke = nullptr;

    jclass stringClass = nullptr;

    jclass booleanClass = nullptr;
    jclass booleanTypeClass = nullptr;
    jmethodID booleanValueOf = nullptr;
    jmethodID booleanBooleanValue = nullptr;

    jclass integerClass = nullptr;
    jclass integerTypeClass = nullptr;
    jmethodID integerValueOf = nullptr;
    jmethodID integerIntValue = nullptr;

    jclass longClass = nullptr;
    jclass longTypeClass = nullptr;
    jmethodID longValueOf = nullptr;
    jmethodID longLongValue = nullptr;

    jclass doubleClass = nullptr;
    jclass doubleTypeClass = nullptr;
    jmethodID doubleValueOf = nullptr;
    jmethodID doubleDoubleValue = nullptr;

    jclass voidTypeClass = nullptr;

    jclass objectClass = nullptr;

    jclass throwableClass = nullptr;
    jmethodID throwableGetMessage = nullptr;

    jclass quickJsExceptionClass = nullptr;
};

struct MethodBinding {
    int id = 0;
    std::string objectName;
    std::string methodName;
    jobject method = nullptr;
    jobject instance = nullptr;
    std::vector<ValueKind> parameterKinds;
    ValueKind returnKind = ValueKind::kVoid;
};

struct QuickJsContext {
    JavaVM* vm = nullptr;
    JSRuntime* runtime = nullptr;
    JSContext* context = nullptr;
    JavaRefs refs;
    std::mutex mutex;
    std::unordered_map<int, std::unique_ptr<MethodBinding>> bindings;
    int nextBindingId = 1;
};

QuickJsContext* getContext(JSContext* ctx) {
    return static_cast<QuickJsContext*>(JS_GetContextOpaque(ctx));
}

JNIEnv* requireEnv(JavaVM* vm) {
    if (vm == nullptr) {
        return nullptr;
    }
    JNIEnv* env = nullptr;
    jint status = vm->GetEnv(reinterpret_cast<void**>(&env), kRequiredJniVersion);
    if (status == JNI_OK) {
        return env;
    }
    if (status == JNI_EDETACHED) {
#ifdef __ANDROID__
        if (vm->AttachCurrentThread(&env, nullptr) != JNI_OK) {
            LOGE("Unable to attach current thread to JVM");
            return nullptr;
        }
        return env;
#else
        return nullptr;
#endif
    }
    LOGE("Failed to obtain JNIEnv (status=%d)", status);
    return nullptr;
}

void clearJavaException(JNIEnv* env) {
    if (env->ExceptionCheck()) {
        env->ExceptionDescribe();
        env->ExceptionClear();
    }
}

void throwQuickJsException(JNIEnv* env, const JavaRefs& refs, const std::string& message) {
    if (refs.quickJsExceptionClass == nullptr) {
        LOGE("QuickJsException class not cached");
        env->ThrowNew(env->FindClass("java/lang/RuntimeException"), message.c_str());
        return;
    }
    env->ThrowNew(refs.quickJsExceptionClass, message.c_str());
}

std::string toUtfString(JNIEnv* env, jstring value) {
    if (value == nullptr) {
        return std::string();
    }
    const char* chars = env->GetStringUTFChars(value, nullptr);
    if (chars == nullptr) {
        return std::string();
    }
    std::string result(chars);
    env->ReleaseStringUTFChars(value, chars);
    return result;
}

std::string jsExceptionToString(JSContext* ctx, JSValueConst exception) {
    std::string message;
    JSValue messageValue = JS_GetPropertyStr(ctx, exception, "message");
    if (!JS_IsException(messageValue) && !JS_IsUndefined(messageValue)) {
        const char* messageChars = JS_ToCString(ctx, messageValue);
        if (messageChars != nullptr) {
            message.assign(messageChars);
            JS_FreeCString(ctx, messageChars);
        }
    }
    JS_FreeValue(ctx, messageValue);
    if (message.empty()) {
        const char* fallback = JS_ToCString(ctx, exception);
        if (fallback != nullptr) {
            message.assign(fallback);
            JS_FreeCString(ctx, fallback);
        }
    }
    if (message.empty()) {
        message = "QuickJS evaluation failed";
    }
    return message;
}

ValueKind classifyParameter(JNIEnv* env, const JavaRefs& refs, jobject clazzObj) {
    if (clazzObj == nullptr) {
        return ValueKind::kVoid;
    }
    jclass clazz = static_cast<jclass>(clazzObj);
    if (env->IsSameObject(clazz, refs.stringClass)) {
        return ValueKind::kString;
    }
    if (env->IsSameObject(clazz, refs.booleanClass) || env->IsSameObject(clazz, refs.booleanTypeClass)) {
        return ValueKind::kBoolean;
    }
    if (env->IsSameObject(clazz, refs.integerClass) || env->IsSameObject(clazz, refs.integerTypeClass)) {
        return ValueKind::kInt;
    }
    if (env->IsSameObject(clazz, refs.longClass) || env->IsSameObject(clazz, refs.longTypeClass)) {
        return ValueKind::kLong;
    }
    if (env->IsSameObject(clazz, refs.doubleClass) || env->IsSameObject(clazz, refs.doubleTypeClass)) {
        return ValueKind::kDouble;
    }
    return ValueKind::kVoid;
}

jobject convertJsToJava(JNIEnv* env, QuickJsContext* quickContext, ValueKind kind, JSValueConst value) {
    JSContext* ctx = quickContext->context;
    switch (kind) {
        case ValueKind::kString: {
            if (JS_IsNull(value) || JS_IsUndefined(value)) {
                return nullptr;
            }
            const char* chars = JS_ToCString(ctx, value);
            if (chars == nullptr) {
                return nullptr;
            }
            jstring result = env->NewStringUTF(chars);
            JS_FreeCString(ctx, chars);
            return result;
        }
        case ValueKind::kBoolean: {
            int32_t boolValue = JS_ToBool(ctx, value);
            if (boolValue < 0) {
                return nullptr;
            }
            return env->CallStaticObjectMethod(quickContext->refs.booleanClass, quickContext->refs.booleanValueOf, (jboolean)(boolValue != 0));
        }
        case ValueKind::kInt: {
            int32_t intValue;
            if (JS_ToInt32(ctx, &intValue, value) < 0) {
                return nullptr;
            }
            return env->CallStaticObjectMethod(quickContext->refs.integerClass, quickContext->refs.integerValueOf, (jint)intValue);
        }
        case ValueKind::kLong: {
            int64_t longValue;
            if (JS_ToInt64(ctx, &longValue, value) < 0) {
                return nullptr;
            }
            return env->CallStaticObjectMethod(quickContext->refs.longClass, quickContext->refs.longValueOf, (jlong)longValue);
        }
        case ValueKind::kDouble: {
            double doubleValue;
            if (JS_ToFloat64(ctx, &doubleValue, value) < 0) {
                return nullptr;
            }
            return env->CallStaticObjectMethod(quickContext->refs.doubleClass, quickContext->refs.doubleValueOf, (jdouble)doubleValue);
        }
        case ValueKind::kVoid:
        default:
            return nullptr;
    }
}

JSValue convertJavaToJs(JNIEnv* env, QuickJsContext* quickContext, ValueKind kind, jobject value) {
    LOGI("convertJavaToJs: kind=%d, value=%p", static_cast<int>(kind), value);
    JSContext* ctx = quickContext->context;
    switch (kind) {
        case ValueKind::kString: {
            if (value == nullptr) {
                LOGI("convertJavaToJs: String value is null");
                return JS_NULL;
            }
            jstring stringValue = static_cast<jstring>(value);
            const char* chars = env->GetStringUTFChars(stringValue, nullptr);
            if (chars == nullptr) {
                LOGE("convertJavaToJs: GetStringUTFChars returned null");
                return JS_NULL;
            }
            LOGI("convertJavaToJs: String value='%s'", chars);
            JSValue jsValue = JS_NewString(ctx, chars);
            env->ReleaseStringUTFChars(stringValue, chars);
            return jsValue;
        }
        case ValueKind::kBoolean: {
            if (value == nullptr) {
                return JS_FALSE;
            }
            jboolean boolValue = env->CallBooleanMethod(value, quickContext->refs.booleanBooleanValue);
            return JS_NewBool(ctx, boolValue == JNI_TRUE);
        }
        case ValueKind::kInt: {
            if (value == nullptr) {
                return JS_NewInt32(ctx, 0);
            }
            jint intValue = env->CallIntMethod(value, quickContext->refs.integerIntValue);
            return JS_NewInt32(ctx, intValue);
        }
        case ValueKind::kLong: {
            if (value == nullptr) {
                return JS_NewInt32(ctx, 0);
            }
            jlong longValue = env->CallLongMethod(value, quickContext->refs.longLongValue);
            return JS_NewInt64(ctx, longValue);
        }
        case ValueKind::kDouble: {
            if (value == nullptr) {
                return JS_NewFloat64(ctx, 0.0);
            }
            jdouble doubleValue = env->CallDoubleMethod(value, quickContext->refs.doubleDoubleValue);
            return JS_NewFloat64(ctx, doubleValue);
        }
        case ValueKind::kVoid:
        default:
            return JS_UNDEFINED;
    }
}

JSValue throwTypeError(JSContext* ctx, const std::string& message) {
    return JS_ThrowTypeError(ctx, "%s", message.c_str());
}

std::string describeThrowable(JNIEnv* env, QuickJsContext* quickContext, jthrowable throwable) {
    if (throwable == nullptr) {
        return "Host method threw an exception";
    }
    jobject messageObject = env->CallObjectMethod(throwable, quickContext->refs.throwableGetMessage);
    if (env->ExceptionCheck()) {
        env->ExceptionClear();
        return "Host method threw an exception";
    }
    std::string message = toUtfString(env, static_cast<jstring>(messageObject));
    env->DeleteLocalRef(messageObject);
    if (message.empty()) {
        return "Host method threw an exception";
    }
    return message;
}

JSValue invokeBinding(JSContext* ctx, QuickJsContext* quickContext, MethodBinding* binding, int argc, JSValueConst* argv) {
    // LOGI("invokeBinding: start for %s.%s", binding->objectName.c_str(), binding->methodName.c_str());
    JNIEnv* env = requireEnv(quickContext->vm);
    if (env == nullptr) {
        LOGE("invokeBinding: Failed to obtain JNI environment");
        return JS_ThrowInternalError(ctx, "Failed to obtain JNI environment");
    }
    // LOGI("invokeBinding: JNI env obtained");

    const size_t paramCount = binding->parameterKinds.size();
    // LOGI("invokeBinding: paramCount=%zu", paramCount);
    jobjectArray argsArray = nullptr;
    if (paramCount > 0) {
        argsArray = env->NewObjectArray(static_cast<jsize>(paramCount), quickContext->refs.objectClass, nullptr);
        if (argsArray == nullptr) {
            LOGE("invokeBinding: Unable to allocate argument array");
            return JS_ThrowInternalError(ctx, "Unable to allocate argument array");
        }
        // LOGI("invokeBinding: created args array");
    }

    std::vector<jobject> localArgs;
    localArgs.reserve(paramCount);

    for (size_t index = 0; index < paramCount; ++index) {
        JSValueConst argument = (index < static_cast<size_t>(argc)) ? argv[index] : JS_UNDEFINED;
        jobject converted = convertJsToJava(env, quickContext, binding->parameterKinds[index], argument);
        if (converted == nullptr && (binding->parameterKinds[index] != ValueKind::kString)) {
            LOGE("invokeBinding: Unable to convert argument %zu", index);
            if (argsArray != nullptr) {
                env->DeleteLocalRef(argsArray);
            }
            for (jobject item : localArgs) {
                env->DeleteLocalRef(item);
            }
            return throwTypeError(ctx, "Unable to convert argument for method " + binding->objectName + "." + binding->methodName);
        }
        localArgs.push_back(converted);
        if (argsArray != nullptr) {
            env->SetObjectArrayElement(argsArray, static_cast<jsize>(index), converted);
        }
    }
    // LOGI("invokeBinding: all arguments converted");

    jobjectArray invocationArgs = nullptr;
    if (paramCount > 0) {
        invocationArgs = argsArray;
    }

    // LOGI("invokeBinding: about to CallObjectMethod");
    // LOGI("invokeBinding: binding->method=%p, methodInvoke=%p, binding->instance=%p", 
    //      binding->method, quickContext->refs.methodInvoke, binding->instance);
    jobject invocationResult = env->CallObjectMethod(
        binding->method,
        quickContext->refs.methodInvoke,
        binding->instance,
        invocationArgs);
    // LOGI("invokeBinding: CallObjectMethod returned, result=%p", invocationResult);

    for (jobject localRef : localArgs) {
        if (localRef != nullptr) {
            env->DeleteLocalRef(localRef);
        }
    }
    if (argsArray != nullptr) {
        env->DeleteLocalRef(argsArray);
    }

    if (env->ExceptionCheck()) {
        LOGE("invokeBinding: Exception occurred during method invocation");
        jthrowable throwable = env->ExceptionOccurred();
        env->ExceptionClear();
        std::string message = describeThrowable(env, quickContext, throwable);
        env->DeleteLocalRef(throwable);
        LOGE("invokeBinding: Exception message: %s", message.c_str());
        return JS_ThrowInternalError(ctx, "%s", message.c_str());
    }
    // LOGI("invokeBinding: no exception");

    JSValue jsResult = JS_UNDEFINED;
    if (binding->returnKind != ValueKind::kVoid) {
        // LOGI("invokeBinding: converting return value, kind=%d", static_cast<int>(binding->returnKind));
        jsResult = convertJavaToJs(env, quickContext, binding->returnKind, invocationResult);
        // LOGI("invokeBinding: converted return value");
    }

    if (invocationResult != nullptr) {
        env->DeleteLocalRef(invocationResult);
    }

    // LOGI("invokeBinding: complete");
    return jsResult;
}

JSValue methodDispatcher(JSContext* ctx, JSValueConst /*this_val*/, int argc, JSValueConst* argv, int magic) {
    // LOGI("methodDispatcher: called with magic=%d, argc=%d", magic, argc);
    QuickJsContext* quickContext = getContext(ctx);
    if (quickContext == nullptr) {
        LOGE("methodDispatcher: QuickJs context is null");
        return JS_ThrowInternalError(ctx, "QuickJs context missing");
    }
    MethodBinding* binding = nullptr;
    {
        std::lock_guard<std::mutex> lock(quickContext->mutex);
        auto iterator = quickContext->bindings.find(magic);
        if (iterator != quickContext->bindings.end()) {
            binding = iterator->second.get();
            // LOGI("methodDispatcher: found binding for %s.%s (method=%p, instance=%p)", 
            //      binding->objectName.c_str(), binding->methodName.c_str(),
            //      binding->method, binding->instance);
        }
    }
    if (binding == nullptr) {
        LOGE("methodDispatcher: Host binding not found for magic=%d", magic);
        return JS_ThrowInternalError(ctx, "Host binding not found");
    }
    // LOGI("methodDispatcher: invoking %s.%s", binding->objectName.c_str(), binding->methodName.c_str());
    JSValue result = invokeBinding(ctx, quickContext, binding, argc, argv);
    // LOGI("methodDispatcher: invocation complete");
    return result;
}

bool ensureGlobalObject(JSContext* ctx, const std::string& name, JSValue& objectValue) {
    JSValue globalObject = JS_GetGlobalObject(ctx);
    JSValue existing = JS_GetPropertyStr(ctx, globalObject, name.c_str());
    if (JS_IsUndefined(existing) || JS_IsNull(existing)) {
        LOGI("ensureGlobalObject: creating new object '%s'", name.c_str());
        JS_FreeValue(ctx, existing);
        existing = JS_NewObject(ctx);
        if (JS_IsException(existing)) {
            JS_FreeValue(ctx, globalObject);
            return false;
        }
        if (JS_SetPropertyStr(ctx, globalObject, name.c_str(), JS_DupValue(ctx, existing)) < 0) {
            JS_FreeValue(ctx, existing);
            JS_FreeValue(ctx, globalObject);
            return false;
        }
    } else {
        LOGI("ensureGlobalObject: reusing existing object '%s'", name.c_str());
    }
    objectValue = existing;
    JS_FreeValue(ctx, globalObject);
    return true;
}

bool cacheJavaReferences(JNIEnv* env, JavaRefs& refs) {
    auto makeGlobal = [&](const char* name) -> jclass {
        jclass local = env->FindClass(name);
        if (local == nullptr) {
            return nullptr;
        }
        jclass global = static_cast<jclass>(env->NewGlobalRef(local));
        env->DeleteLocalRef(local);
        return global;
    };

    refs.objectClass = makeGlobal("java/lang/Object");
    refs.methodClass = makeGlobal("java/lang/reflect/Method");
    refs.stringClass = makeGlobal("java/lang/String");
    refs.booleanClass = makeGlobal("java/lang/Boolean");
    refs.integerClass = makeGlobal("java/lang/Integer");
    refs.longClass = makeGlobal("java/lang/Long");
    refs.doubleClass = makeGlobal("java/lang/Double");
    refs.throwableClass = makeGlobal("java/lang/Throwable");
    refs.quickJsExceptionClass = makeGlobal("io/ton/walletkit/quickjs/QuickJsException");

    if (refs.objectClass == nullptr || refs.methodClass == nullptr || refs.stringClass == nullptr ||
        refs.booleanClass == nullptr || refs.integerClass == nullptr || refs.longClass == nullptr ||
        refs.doubleClass == nullptr || refs.throwableClass == nullptr || refs.quickJsExceptionClass == nullptr) {
        return false;
    }

    jfieldID booleanTypeField = env->GetStaticFieldID(refs.booleanClass, "TYPE", "Ljava/lang/Class;");
    jfieldID integerTypeField = env->GetStaticFieldID(refs.integerClass, "TYPE", "Ljava/lang/Class;");
    jfieldID longTypeField = env->GetStaticFieldID(refs.longClass, "TYPE", "Ljava/lang/Class;");
    jfieldID doubleTypeField = env->GetStaticFieldID(refs.doubleClass, "TYPE", "Ljava/lang/Class;");

    if (booleanTypeField == nullptr || integerTypeField == nullptr || longTypeField == nullptr || doubleTypeField == nullptr) {
        return false;
    }

    refs.booleanTypeClass = static_cast<jclass>(env->NewGlobalRef(env->GetStaticObjectField(refs.booleanClass, booleanTypeField)));
    refs.integerTypeClass = static_cast<jclass>(env->NewGlobalRef(env->GetStaticObjectField(refs.integerClass, integerTypeField)));
    refs.longTypeClass = static_cast<jclass>(env->NewGlobalRef(env->GetStaticObjectField(refs.longClass, longTypeField)));
    refs.doubleTypeClass = static_cast<jclass>(env->NewGlobalRef(env->GetStaticObjectField(refs.doubleClass, doubleTypeField)));

    jclass voidClass = env->FindClass("java/lang/Void");
    if (voidClass == nullptr) {
        return false;
    }
    jfieldID voidTypeField = env->GetStaticFieldID(voidClass, "TYPE", "Ljava/lang/Class;");
    if (voidTypeField == nullptr) {
        env->DeleteLocalRef(voidClass);
        return false;
    }
    jobject voidType = env->GetStaticObjectField(voidClass, voidTypeField);
    env->DeleteLocalRef(voidClass);
    refs.voidTypeClass = static_cast<jclass>(env->NewGlobalRef(voidType));
    env->DeleteLocalRef(voidType);

    refs.methodInvoke = env->GetMethodID(refs.methodClass, "invoke", "(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;");
    refs.booleanValueOf = env->GetStaticMethodID(refs.booleanClass, "valueOf", "(Z)Ljava/lang/Boolean;");
    refs.booleanBooleanValue = env->GetMethodID(refs.booleanClass, "booleanValue", "()Z");
    refs.integerValueOf = env->GetStaticMethodID(refs.integerClass, "valueOf", "(I)Ljava/lang/Integer;");
    refs.integerIntValue = env->GetMethodID(refs.integerClass, "intValue", "()I");
    refs.longValueOf = env->GetStaticMethodID(refs.longClass, "valueOf", "(J)Ljava/lang/Long;");
    refs.longLongValue = env->GetMethodID(refs.longClass, "longValue", "()J");
    refs.doubleValueOf = env->GetStaticMethodID(refs.doubleClass, "valueOf", "(D)Ljava/lang/Double;");
    refs.doubleDoubleValue = env->GetMethodID(refs.doubleClass, "doubleValue", "()D");
    refs.throwableGetMessage = env->GetMethodID(refs.throwableClass, "getMessage", "()Ljava/lang/String;");

    return refs.methodInvoke != nullptr && refs.booleanValueOf != nullptr && refs.booleanBooleanValue != nullptr &&
        refs.integerValueOf != nullptr && refs.integerIntValue != nullptr && refs.longValueOf != nullptr &&
        refs.longLongValue != nullptr && refs.doubleValueOf != nullptr && refs.doubleDoubleValue != nullptr &&
        refs.throwableGetMessage != nullptr;
}

void releaseJavaReferences(JNIEnv* env, JavaRefs& refs) {
    auto release = [&](jclass& clazz) {
        if (clazz != nullptr) {
            env->DeleteGlobalRef(clazz);
            clazz = nullptr;
        }
    };

    release(refs.methodClass);
    release(refs.stringClass);
    release(refs.booleanClass);
    release(refs.booleanTypeClass);
    release(refs.integerClass);
    release(refs.integerTypeClass);
    release(refs.longClass);
    release(refs.longTypeClass);
    release(refs.doubleClass);
    release(refs.doubleTypeClass);
    release(refs.voidTypeClass);
    release(refs.objectClass);
    release(refs.throwableClass);
    release(refs.quickJsExceptionClass);
}

}  // namespace

extern "C" JNIEXPORT jlong JNICALL
Java_io_ton_walletkit_quickjs_QuickJs_nativeCreate(JNIEnv* env, jclass /*clazz*/) {
    auto* quickContext = new QuickJsContext();
    if (env->GetJavaVM(&quickContext->vm) != JNI_OK) {
        delete quickContext;
        return 0;
    }
    if (!cacheJavaReferences(env, quickContext->refs)) {
        delete quickContext;
        return 0;
    }
    quickContext->runtime = JS_NewRuntime();
    if (quickContext->runtime == nullptr) {
        delete quickContext;
        return 0;
    }
    quickContext->context = JS_NewContext(quickContext->runtime);
    if (quickContext->context == nullptr) {
        JS_FreeRuntime(quickContext->runtime);
        delete quickContext;
        return 0;
    }

    JS_SetContextOpaque(quickContext->context, quickContext);

    return reinterpret_cast<jlong>(quickContext);
}

extern "C" JNIEXPORT void JNICALL
Java_io_ton_walletkit_quickjs_QuickJs_nativeDestroy(JNIEnv* env, jobject /*thiz*/, jlong pointer) {
    if (pointer == 0) {
        return;
    }
    auto* quickContext = reinterpret_cast<QuickJsContext*>(pointer);
    if (quickContext == nullptr) {
        return;
    }
    {
        std::lock_guard<std::mutex> lock(quickContext->mutex);
        for (auto& entry : quickContext->bindings) {
            MethodBinding* binding = entry.second.get();
            if (binding->method != nullptr) {
                env->DeleteGlobalRef(binding->method);
                binding->method = nullptr;
            }
            if (binding->instance != nullptr) {
                env->DeleteGlobalRef(binding->instance);
                binding->instance = nullptr;
            }
        }
        quickContext->bindings.clear();
    }
    releaseJavaReferences(env, quickContext->refs);
    if (quickContext->context != nullptr) {
        JS_FreeContext(quickContext->context);
    }
    if (quickContext->runtime != nullptr) {
        JS_FreeRuntime(quickContext->runtime);
    }
    delete quickContext;
}

extern "C" JNIEXPORT jobject JNICALL
Java_io_ton_walletkit_quickjs_QuickJs_nativeEvaluate(JNIEnv* env, jobject /*thiz*/, jlong pointer, jstring script, jstring filename) {
    if (pointer == 0) {
        throwQuickJsException(env, JavaRefs{}, "QuickJs runtime has been destroyed");
        return nullptr;
    }
    auto* quickContext = reinterpret_cast<QuickJsContext*>(pointer);
    const char* scriptChars = env->GetStringUTFChars(script, nullptr);
    const char* filenameChars = env->GetStringUTFChars(filename, nullptr);
    if (scriptChars == nullptr || filenameChars == nullptr) {
        if (scriptChars != nullptr) {
            env->ReleaseStringUTFChars(script, scriptChars);
        }
        if (filenameChars != nullptr) {
            env->ReleaseStringUTFChars(filename, filenameChars);
        }
        throwQuickJsException(env, quickContext->refs, "Unable to access script characters");
        return nullptr;
    }
    JSValue result = JS_Eval(quickContext->context, scriptChars, strlen(scriptChars), filenameChars, JS_EVAL_TYPE_GLOBAL);
    env->ReleaseStringUTFChars(script, scriptChars);
    env->ReleaseStringUTFChars(filename, filenameChars);

    if (JS_IsException(result)) {
        JSValue exception = JS_GetException(quickContext->context);
        std::string message = jsExceptionToString(quickContext->context, exception);
        JS_FreeValue(quickContext->context, exception);
        JS_FreeValue(quickContext->context, result);
        throwQuickJsException(env, quickContext->refs, message);
        return nullptr;
    }

    jobject javaResult = nullptr;
    if (!JS_IsUndefined(result) && !JS_IsNull(result)) {
        if (JS_IsString(result)) {
            javaResult = convertJsToJava(env, quickContext, ValueKind::kString, result);
        } else if (JS_IsNumber(result)) {
            javaResult = convertJsToJava(env, quickContext, ValueKind::kDouble, result);
        } else if (JS_IsBool(result)) {
            javaResult = convertJsToJava(env, quickContext, ValueKind::kBoolean, result);
        }
    }
    JS_FreeValue(quickContext->context, result);
    return javaResult;
}

extern "C" JNIEXPORT jint JNICALL
Java_io_ton_walletkit_quickjs_QuickJs_nativeExecutePendingJob(JNIEnv* env, jobject /*thiz*/, jlong pointer) {
    if (pointer == 0) {
        throwQuickJsException(env, JavaRefs{}, "QuickJs runtime has been destroyed");
        return -1;
    }
    auto* quickContext = reinterpret_cast<QuickJsContext*>(pointer);
    if (quickContext->runtime == nullptr) {
        throwQuickJsException(env, quickContext->refs, "QuickJs runtime is not initialised");
        return -1;
    }
    JSContext* jobContext = nullptr;
    int result = JS_ExecutePendingJob(quickContext->runtime, &jobContext);
    if (result < 0) {
        if (jobContext != nullptr) {
            JSValue exception = JS_GetException(jobContext);
            std::string message = jsExceptionToString(jobContext, exception);
            JS_FreeValue(jobContext, exception);
            throwQuickJsException(env, quickContext->refs, message);
        } else {
            throwQuickJsException(env, quickContext->refs, "JS_ExecutePendingJob failed");
        }
        return -1;
    }
    return result;
}

extern "C" JNIEXPORT void JNICALL
Java_io_ton_walletkit_quickjs_QuickJs_nativeRegister(JNIEnv* env, jobject /*thiz*/, jlong pointer, jstring objectName, jstring methodName, jobject method, jobject instance, jobjectArray parameterTypes, jobject returnType) {
    LOGI("nativeRegister: called");
    if (pointer == 0) {
        throwQuickJsException(env, JavaRefs{}, "QuickJs runtime has been destroyed");
        return;
    }
    auto* quickContext = reinterpret_cast<QuickJsContext*>(pointer);
    QuickJsContext& context = *quickContext;

    std::string objectNameUtf = toUtfString(env, objectName);
    std::string methodNameUtf = toUtfString(env, methodName);
    LOGI("nativeRegister: %s.%s", objectNameUtf.c_str(), methodNameUtf.c_str());
    if (objectNameUtf.empty() || methodNameUtf.empty()) {
        throwQuickJsException(env, context.refs, "Object or method name cannot be empty");
        return;
    }

    jsize parameterCount = parameterTypes == nullptr ? 0 : env->GetArrayLength(parameterTypes);

    auto binding = std::make_unique<MethodBinding>();
    binding->objectName = objectNameUtf;
    binding->methodName = methodNameUtf;
    LOGI("nativeRegister: method local ref=%p", method);
    binding->method = env->NewGlobalRef(method);
    LOGI("nativeRegister: method global ref=%p", binding->method);
    binding->instance = env->NewGlobalRef(instance);
    LOGI("nativeRegister: instance global ref=%p", binding->instance);
    binding->parameterKinds.reserve(parameterCount);

    for (jsize index = 0; index < parameterCount; ++index) {
        jobject parameterType = env->GetObjectArrayElement(parameterTypes, index);
        ValueKind kind = classifyParameter(env, context.refs, parameterType);
        env->DeleteLocalRef(parameterType);
        if (kind == ValueKind::kVoid) {
            throwQuickJsException(env, context.refs, "Unsupported parameter type for method " + binding->objectName + "." + binding->methodName);
            env->DeleteGlobalRef(binding->method);
            env->DeleteGlobalRef(binding->instance);
            return;
        }
        binding->parameterKinds.push_back(kind);
    }

    ValueKind returnKind = ValueKind::kVoid;
    if (returnType != nullptr && !env->IsSameObject(returnType, context.refs.voidTypeClass)) {
        returnKind = classifyParameter(env, context.refs, returnType);
        if (returnKind == ValueKind::kVoid && !env->IsSameObject(returnType, context.refs.stringClass)) {
            throwQuickJsException(env, context.refs, "Unsupported return type for method " + binding->objectName + "." + binding->methodName);
            env->DeleteGlobalRef(binding->method);
            env->DeleteGlobalRef(binding->instance);
            return;
        }
        if (returnKind == ValueKind::kVoid && env->IsSameObject(returnType, context.refs.stringClass)) {
            returnKind = ValueKind::kString;
        }
    }
    binding->returnKind = returnKind;

    int bindingId;
    {
        std::lock_guard<std::mutex> lock(context.mutex);
        bindingId = context.nextBindingId++;
        binding->id = bindingId;
        context.bindings.emplace(bindingId, std::move(binding));
    }
    LOGI("nativeRegister: assigned magic=%d to %s.%s", bindingId, objectNameUtf.c_str(), methodNameUtf.c_str());

    JSValue objectValue;
    if (!ensureGlobalObject(context.context, objectNameUtf, objectValue)) {
        std::lock_guard<std::mutex> lock(context.mutex);
        auto iterator = context.bindings.find(bindingId);
        if (iterator != context.bindings.end()) {
            MethodBinding* stored = iterator->second.get();
            env->DeleteGlobalRef(stored->method);
            env->DeleteGlobalRef(stored->instance);
            context.bindings.erase(iterator);
        }
        throwQuickJsException(env, context.refs, "Failed to create host object " + objectNameUtf);
        return;
    }

    JSValue function = JS_NewCFunctionMagic(
        context.context,
        methodDispatcher,
        methodNameUtf.c_str(),
        static_cast<int>(parameterCount),
        JS_CFUNC_generic_magic,
        bindingId);
    LOGI("nativeRegister: created JS function for %s with magic=%d", methodNameUtf.c_str(), bindingId);
    if (JS_IsException(function)) {
        JS_FreeValue(context.context, objectValue);
        std::lock_guard<std::mutex> lock(context.mutex);
        auto iterator = context.bindings.find(bindingId);
        if (iterator != context.bindings.end()) {
            MethodBinding* stored = iterator->second.get();
            env->DeleteGlobalRef(stored->method);
            env->DeleteGlobalRef(stored->instance);
            context.bindings.erase(iterator);
        }
        throwQuickJsException(env, context.refs, "Failed to create native function for " + objectNameUtf + "." + methodNameUtf);
        return;
    }

    if (JS_DefinePropertyValueStr(context.context, objectValue, methodNameUtf.c_str(), function, JS_PROP_CONFIGURABLE | JS_PROP_ENUMERABLE | JS_PROP_WRITABLE) < 0) {
        JS_FreeValue(context.context, objectValue);
        std::lock_guard<std::mutex> lock(context.mutex);
        auto iterator = context.bindings.find(bindingId);
        if (iterator != context.bindings.end()) {
            MethodBinding* stored = iterator->second.get();
            env->DeleteGlobalRef(stored->method);
            env->DeleteGlobalRef(stored->instance);
            context.bindings.erase(iterator);
        }
        throwQuickJsException(env, context.refs, "Failed to attach method " + objectNameUtf + "." + methodNameUtf);
        return;
    }

    JS_FreeValue(context.context, objectValue);
}
