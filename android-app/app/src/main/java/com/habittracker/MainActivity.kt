package com.habittracker

import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputEditText
import com.habittracker.databinding.ActivityMainBinding
import com.habittracker.ui.HabitsAdapter
import com.habittracker.widget.HabitWidgetProvider

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private val viewModel: HabitViewModel by viewModels()
    private lateinit var adapter: HabitsAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        title = getString(R.string.app_name)

        viewModel.resetDailyCompletions()
        setupRecyclerView()
        setupFab()
        observeHabits()
    }

    private fun setupRecyclerView() {
        adapter = HabitsAdapter(
            onToggle = { habit ->
                viewModel.toggleHabitCompletion(habit)
                HabitWidgetProvider.updateAllWidgets(this)
            },
            onDelete = { habit ->
                MaterialAlertDialogBuilder(this)
                    .setTitle("Удалить привычку")
                    .setMessage("Удалить «${habit.name}»?")
                    .setPositiveButton("Удалить") { _, _ ->
                        viewModel.deleteHabit(habit)
                        HabitWidgetProvider.updateAllWidgets(this)
                    }
                    .setNegativeButton("Отмена", null)
                    .show()
            }
        )
        binding.recyclerView.layoutManager = LinearLayoutManager(this)
        binding.recyclerView.adapter = adapter
    }

    private fun setupFab() {
        binding.fab.setOnClickListener { showAddHabitDialog() }
    }

    private fun observeHabits() {
        viewModel.allHabits.observe(this) { habits ->
            adapter.submitList(habits)
            binding.emptyView.visibility = if (habits.isEmpty()) View.VISIBLE else View.GONE
            binding.recyclerView.visibility = if (habits.isEmpty()) View.GONE else View.VISIBLE
            HabitWidgetProvider.updateAllWidgets(this)
        }
    }

    private fun showAddHabitDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_add_habit, null)
        val nameInput = dialogView.findViewById<TextInputEditText>(R.id.habitNameInput)
        val emojiInput = dialogView.findViewById<TextInputEditText>(R.id.habitEmojiInput)

        MaterialAlertDialogBuilder(this)
            .setTitle("Новая привычка")
            .setView(dialogView)
            .setPositiveButton("Добавить") { _, _ ->
                val name = nameInput.text.toString().trim()
                val emoji = emojiInput.text.toString().trim()
                if (name.isNotEmpty()) viewModel.addHabit(name, emoji)
            }
            .setNegativeButton("Отмена", null)
            .show()
    }
}
