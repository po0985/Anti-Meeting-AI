package com.habittracker.data

import android.content.Context
import androidx.lifecycle.LiveData

class HabitRepository(context: Context) {
    private val habitDao = HabitDatabase.getDatabase(context).habitDao()

    val allHabits: LiveData<List<Habit>> = habitDao.getAllHabits()

    suspend fun insert(habit: Habit) = habitDao.insert(habit)
    suspend fun update(habit: Habit) = habitDao.update(habit)
    suspend fun delete(habit: Habit) = habitDao.delete(habit)
    suspend fun getAllHabitsSync(): List<Habit> = habitDao.getAllHabitsSync()
}
