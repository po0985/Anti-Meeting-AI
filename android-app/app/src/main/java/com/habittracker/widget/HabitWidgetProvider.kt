package com.habittracker.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.habittracker.MainActivity
import com.habittracker.R
import com.habittracker.data.HabitDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class HabitWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (id in appWidgetIds) updateWidget(context, appWidgetManager, id)
    }

    companion object {
        fun updateAllWidgets(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, HabitWidgetProvider::class.java))
            for (id in ids) updateWidget(context, manager, id)
        }

        private fun updateWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
            CoroutineScope(Dispatchers.IO).launch {
                val habits = HabitDatabase.getDatabase(context).habitDao().getAllHabitsSync()
                val total = habits.size
                val done = habits.count { it.completedToday }

                val views = RemoteViews(context.packageName, R.layout.widget_habit_tracker)
                views.setTextViewText(R.id.widgetProgress, "$done / $total")
                views.setTextViewText(
                    R.id.widgetSubtitle,
                    when {
                        total == 0 -> "Добавьте привычки"
                        done == total -> "Всё выполнено! 🎉"
                        done == 0 -> "Начнём прямо сейчас?"
                        else -> "Так держать!"
                    }
                )

                val intent = Intent(context, MainActivity::class.java)
                val pi = PendingIntent.getActivity(
                    context, 0, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widgetContainer, pi)
                manager.updateAppWidget(widgetId, views)
            }
        }
    }
}
