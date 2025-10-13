cmake_minimum_required(VERSION 3.22.1)

project(walletkitquickjs)

set(CMAKE_C_STANDARD 17)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

set(QUICKJS_NG_DIR "${CMAKE_CURRENT_SOURCE_DIR}/third_party/quickjs-ng")

# Check if QuickJS sources exist - if not, skip native build
# This allows WebView variant to build without QuickJS sources
if (NOT EXISTS "${QUICKJS_NG_DIR}/quickjs.h")
    message(WARNING "quickjs-ng sources are missing. Skipping native build. Run ./gradlew :bridge:prepareQuickJs to build full variant with QuickJS support.")
    return()
endif()

set(QUICKJS_NG_SOURCES
    ${QUICKJS_NG_DIR}/quickjs.c
    ${QUICKJS_NG_DIR}/libregexp.c
    ${QUICKJS_NG_DIR}/libunicode.c
    ${QUICKJS_NG_DIR}/cutils.c
    ${QUICKJS_NG_DIR}/xsum.c
)

add_library(walletkitquickjs SHARED
    quickjs_bridge.cpp
    ${QUICKJS_NG_SOURCES}
)

target_include_directories(walletkitquickjs
    PRIVATE
        ${QUICKJS_NG_DIR}
)

target_compile_definitions(walletkitquickjs
    PRIVATE
        CONFIG_VERSION="quickjs-ng v0.10.1"
        _GNU_SOURCE
)

target_compile_options(walletkitquickjs
    PRIVATE
        -Os
        -fvisibility=hidden
        -fexceptions
        -Wno-implicit-fallthrough
        -Wno-missing-field-initializers
        -Wno-unused-parameter
)

target_link_libraries(walletkitquickjs
    log
)

target_link_options(walletkitquickjs
    PRIVATE
        -Wl,-z,max-page-size=16384
        -Wl,-z,common-page-size=4096
        -Wl,--hash-style=both
)
