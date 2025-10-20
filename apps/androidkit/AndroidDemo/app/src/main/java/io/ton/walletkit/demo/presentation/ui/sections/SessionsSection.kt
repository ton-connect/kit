package io.ton.walletkit.demo.presentation.ui.sections

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.R
import io.ton.walletkit.demo.presentation.model.SessionSummary
import io.ton.walletkit.demo.presentation.ui.components.EmptyStateCard
import io.ton.walletkit.demo.presentation.ui.components.SessionCard
import io.ton.walletkit.demo.presentation.ui.preview.PreviewData

@Composable
fun SessionsSection(sessions: List<SessionSummary>, onDisconnect: (String) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(SESSIONS_SECTION_SPACING)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                stringResource(R.string.sessions_title),
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Spacer(modifier = Modifier.width(SESSIONS_TITLE_SPACING))
            Text(
                "${sessions.size}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.primary,
            )
        }
        if (sessions.isEmpty()) {
            EmptyStateCard(
                title = stringResource(R.string.sessions_empty_title),
                description = stringResource(R.string.sessions_empty_description),
            )
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(SESSIONS_LIST_SPACING)) {
                sessions.forEach { session ->
                    SessionCard(
                        session = session,
                        onDisconnect = { onDisconnect(session.sessionId) },
                    )
                }
            }
        }
    }
}

private val SESSIONS_SECTION_SPACING = 12.dp
private val SESSIONS_TITLE_SPACING = 8.dp
private val SESSIONS_LIST_SPACING = 12.dp

@Preview(showBackground = true)
@Composable
private fun SessionsSectionPreview() {
    SessionsSection(sessions = listOf(PreviewData.session), onDisconnect = {})
}
