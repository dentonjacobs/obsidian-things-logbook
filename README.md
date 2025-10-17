# 📕 OmniFocus Logbook for Obsidian

This plugin for [Obsidian](https://obsidian.md/) will periodically sync your [OmniFocus](https://www.omnigroup.com/omnifocus/) completed and dropped actions with your Obsidian Daily Notes.

## Why?

I love using OmniFocus for task management. But I also want Obsidian daily notes to be a holistic view of my day-to-day. This plugin dumps completed and dropped actions from OmniFocus into my daily notes, meaning I can keep my same workflow, and my Second Brain has a new data source.

## Disclaimer 🚨

The initial sync will backfill your entire OmniFocus history of completed and dropped actions into Obsidian. This potentially means creating/modifying hundreds of files. I recommend testing this plugin out in a new vault first to make sure you're happy with the result.

### Backup your data

While I have tested this plugin with my own data, your mileage may vary. I am not at fault for any data loss that may incur. Backup your data!

## Usage

This plugin fetches all your completed and dropped actions from OmniFocus and adds them to the Daily Note corresponding to the **completion date** of the action.

Actions are grouped by their folder in OmniFocus. The plugin displays:
- Completed actions (marked with `[x]`)
- Dropped actions (marked with `[c]` by default, configurable)
- Any subtasks/checklist items
- Tags associated with the actions
- Notes attached to actions (optional)

Each action is formatted as a markdown link that opens the action in OmniFocus when clicked.

### Example Output

```markdown
### Completed Tasks

#### Work

- [x] [Complete project proposal](omnifocus:///task-id-here) #logbook/work
    Project notes and details
- [c] [Deprecated feature request](omnifocus:///task-id-here) #logbook/work

#### Personal

- [x] [Buy groceries](omnifocus:///task-id-here) #logbook/personal
```

## Settings

| Setting         | Description                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| Section Heading | Controls where the actions will be displayed within your daily notes. Defaults to `## Logbook`        |
| Sync Frequency  | How often you want to fetch the actions from the OmniFocus database                                   |
| Tag Prefix      | Allows you to prefix your OmniFocus tags into a parent tag (e.g. `#logbook/work` `#logbook/school`)  |
| Canceled Mark   | Character to use for dropped actions. Defaults to `c` for `[c]`                                       |
| Include notes   | Whether to include action notes in the synced output                                                  |

## Requirements

- macOS (OmniFocus is macOS/iOS only)
- OmniFocus 4.8 or later
- Obsidian with Daily Notes enabled

## Say Thanks 🙏

If you like this plugin and would like to buy me a coffee, you can!

[<img src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png" alt="BuyMeACoffee" width="100">](https://www.buymeacoffee.com/liamcain)

Like my work and want to see more like it? You can sponsor me.

[![GitHub Sponsors](https://img.shields.io/github/sponsors/liamcain?style=social)](https://github.com/sponsors/liamcain)
