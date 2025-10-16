package io.ton.walletkit.demo.presentation.ui.sections

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp

@Composable
fun EventLogSection(events: List<String>) {
    Column(verticalArrangement = Arrangement.spacedBy(EVENT_SECTION_SPACING)) {
        Text(RECENT_EVENTS_TITLE, style = MaterialTheme.typography.titleMedium)
        events.forEach { event ->
            HorizontalDivider()
            Text(event, style = MaterialTheme.typography.bodySmall)
        }
    }
}

private const val RECENT_EVENTS_TITLE = "Recent events"
private val EVENT_SECTION_SPACING = 8.dp

@Preview(showBackground = true)
@Composable
private fun EventLogSectionPreview() {
    EventLogSection(events = listOf("Handled TON Connect URL", "Approved transaction"))
}
