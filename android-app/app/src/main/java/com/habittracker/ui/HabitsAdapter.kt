package com.habittracker.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.habittracker.data.Habit
import com.habittracker.databinding.ItemHabitBinding

class HabitsAdapter(
    private val onToggle: (Habit) -> Unit,
    private val onDelete: (Habit) -> Unit
) : ListAdapter<Habit, HabitsAdapter.HabitViewHolder>(HabitDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HabitViewHolder {
        val binding = ItemHabitBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return HabitViewHolder(binding)
    }

    override fun onBindViewHolder(holder: HabitViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class HabitViewHolder(private val binding: ItemHabitBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(habit: Habit) {
            binding.habitEmoji.text = habit.emoji
            binding.habitName.text = habit.name
            binding.streakText.text = if (habit.streak > 0) "🔥 ${habit.streak} дней" else "Начни сегодня"

            binding.habitCheckbox.setOnCheckedChangeListener(null)
            binding.habitCheckbox.isChecked = habit.completedToday
            binding.habitCheckbox.setOnCheckedChangeListener { _, _ ->
                onToggle(habit)
            }

            binding.deleteButton.setOnClickListener { onDelete(habit) }
        }
    }

    class HabitDiffCallback : DiffUtil.ItemCallback<Habit>() {
        override fun areItemsTheSame(oldItem: Habit, newItem: Habit) = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Habit, newItem: Habit) = oldItem == newItem
    }
}
