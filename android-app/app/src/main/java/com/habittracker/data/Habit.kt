package com.habittracker.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "habits")
data class Habit(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val emoji: String = "✅",
    val streak: Int = 0,
    val lastCompletedDate: String = "",
    val completedToday: Boolean = false
)
