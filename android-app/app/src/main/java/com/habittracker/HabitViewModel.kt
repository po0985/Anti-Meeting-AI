package com.habittracker

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.habittracker.data.Habit
import com.habittracker.data.HabitRepository
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class HabitViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = HabitRepository(application)
    val allHabits = repository.allHabits

    private val dateFormatter = DateTimeFormatter.ISO_LOCAL_DATE
    private val today: String get() = LocalDate.now().format(dateFormatter)

    fun addHabit(name: String, emoji: String) {
        viewModelScope.launch {
            repository.insert(Habit(name = name, emoji = emoji.ifEmpty { "✅" }))
        }
    }

    fun deleteHabit(habit: Habit) {
        viewModelScope.launch {
            repository.delete(habit)
        }
    }

    fun toggleHabitCompletion(habit: Habit) {
        viewModelScope.launch {
            val currentDate = today
            val alreadyDoneToday = habit.lastCompletedDate == currentDate

            val updated = if (!alreadyDoneToday) {
                val yesterday = LocalDate.now().minusDays(1).format(dateFormatter)
                val newStreak = if (habit.lastCompletedDate == yesterday) habit.streak + 1 else 1
                habit.copy(completedToday = true, lastCompletedDate = currentDate, streak = newStreak)
            } else {
                habit.copy(completedToday = false, lastCompletedDate = "", streak = maxOf(0, habit.streak - 1))
            }
            repository.update(updated)
        }
    }

    fun resetDailyCompletions() {
        viewModelScope.launch {
            val currentDate = today
            repository.getAllHabitsSync().forEach { habit ->
                if (habit.completedToday && habit.lastCompletedDate != currentDate) {
                    repository.update(habit.copy(completedToday = false))
                }
            }
        }
    }
}
