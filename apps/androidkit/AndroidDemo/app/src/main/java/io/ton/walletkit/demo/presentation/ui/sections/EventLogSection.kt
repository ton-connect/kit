package io.ton.walletkit.demo.presentation.ui.sections

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import io.ton.walletkit.demo.R

@Composable
fun EventLogSection(events: List<String>) {
    Column(verticalArrangement = Arrangement.spacedBy(EVENT_SECTION_SPACING)) {
        Text(stringResource(R.string.events_recent_title), style = MaterialTheme.typography.titleMedium)
        events.forEach { event ->
            HorizontalDivider()
            Text(event, style = MaterialTheme.typography.bodySmall)
        }
    }
}
private val EVENT_SECTION_SPACING = 8.dp

@Preview(showBackground = true)
@Composable
private fun EventLogSectionPreview() {
    EventLogSection(events = listOf("Handled TON Connect URL", "Approved transaction"))
}
