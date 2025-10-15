import * as os from "os";
import * as path from "path";

import { OMNIFOCUS_DB_PATH } from "./constants";
import { querySqliteDB } from "./sqlite";

export const TASK_FETCH_LIMIT = 1000;

export interface ISubTask {
  completed: boolean;
  title: string;
}

export interface ITask {
  uuid: string;
  title: string;
  notes: string;
  folder?: string;
  tags: string[];
  startDate: number;
  stopDate: number;
  cancelled: boolean;
  subtasks: ISubTask[];
}

export interface ITaskRecord {
  uuid: string;
  title?: string;
  notes: string;
  folder?: string;
  dateCompleted: number;
  state: number;
  tag?: string;
}

export interface IChecklistItemRecord {
  uuid: string;
  taskId: string;
  title: string;
  state: number;
  dateCompleted: number;
}

// OmniFocus database path
const omnifocusSqlitePath = OMNIFOCUS_DB_PATH.replace("~", os.homedir());

// OmniFocus uses Core Data timestamps (seconds since 2001-01-01)
// Unix uses timestamps (seconds since 1970-01-01)
// The difference is 978307200 seconds
const CORE_DATA_EPOCH_OFFSET = 978307200;

function unixToOmniFocusTimestamp(unixTimestamp: number): number {
  return unixTimestamp - CORE_DATA_EPOCH_OFFSET;
}

function omniFocusToUnixTimestamp(omniFocusTimestamp: number): number {
  return omniFocusTimestamp + CORE_DATA_EPOCH_OFFSET;
}

export class OmniFocusSQLiteSyncError extends Error {}

// OmniFocus state constants
// state: 0 = available, 1 = completed, 2 = dropped
const STATE_COMPLETED = 1;
const STATE_DROPPED = 2;

export function buildTasksFromSQLRecords(
  taskRecords: ITaskRecord[],
  checklistRecords: IChecklistItemRecord[]
): ITask[] {
  const tasks: Record<string, ITask> = {};
  taskRecords.forEach(({ tag, dateCompleted, ...task }) => {
    const id = task.uuid;
    const { state, title, ...other } = task;

    if (tasks[id]) {
      tasks[id].tags.push(tag);
    } else {
      tasks[id] = {
        ...other,
        stopDate: omniFocusToUnixTimestamp(dateCompleted),
        startDate: 0, // OmniFocus doesn't track start date the same way
        cancelled: STATE_DROPPED === state,
        title: (title || "").trimEnd(),
        subtasks: [],
        tags: [tag],
      };
    }
  });

  checklistRecords.forEach(({ taskId, title, state }) => {
    const task = tasks[taskId];
    const subtask = {
      completed: state === STATE_COMPLETED,
      title: title.trimEnd(),
    };

    // checklist item might be completed before task
    if (task) {
      if (task.subtasks) {
        task.subtasks.push(subtask);
      } else {
        task.subtasks = [subtask];
      }
    }
  });

  return Object.values(tasks);
}

async function getTasksFromOmniFocusDb(
  latestSyncTime: number
): Promise<ITaskRecord[]> {
  return querySqliteDB<ITaskRecord>(
    omnifocusSqlitePath,
    `SELECT
        Task.persistentIdentifier as uuid,
        Task.name as title,
        Task.note as notes,
        Task.dateCompleted as dateCompleted,
        Task.taskState as state,
        Folder.name as folder,
        Tag.name as tag
    FROM
        Task
    LEFT JOIN TaskTag
        ON TaskTag.task = Task.persistentIdentifier
    LEFT JOIN Tag
        ON Tag.persistentIdentifier = TaskTag.tag
    LEFT JOIN ProjectInfo
        ON Task.containingProjectInfo = ProjectInfo.pk
    LEFT JOIN Folder
        ON ProjectInfo.folder = Folder.persistentIdentifier
    WHERE
        Task.dateCompleted IS NOT NULL
        AND Task.dateCompleted > ${latestSyncTime}
        AND Task.taskState IN (1, 2)
    ORDER BY
        Task.dateCompleted
    LIMIT ${TASK_FETCH_LIMIT}
        `
  );
}

async function getChecklistItemsOmniFocusDb(
  latestSyncTime: number
): Promise<IChecklistItemRecord[]> {
  return querySqliteDB<IChecklistItemRecord>(
    omnifocusSqlitePath,
    `SELECT
        Task.persistentIdentifier as uuid,
        Task.parent as taskId,
        Task.name as title,
        Task.taskState as state,
        Task.dateCompleted as dateCompleted
    FROM
        Task
    WHERE
        Task.parent IS NOT NULL
        AND Task.dateCompleted IS NOT NULL
        AND Task.dateCompleted > ${latestSyncTime}
        AND Task.name IS NOT NULL
        AND Task.name != ""
    ORDER BY
        Task.dateCompleted
    LIMIT ${TASK_FETCH_LIMIT}
        `
  );
}

export async function getTasksFromOmniFocusLogbook(
  latestSyncTime: number
): Promise<ITaskRecord[]> {
  const taskRecords: ITaskRecord[] = [];
  let isSyncCompleted = false;
  let stopTime = unixToOmniFocusTimestamp(window.moment.unix(latestSyncTime).startOf("day").unix());

  try {
    while (!isSyncCompleted) {
      console.debug("[OmniFocus Logbook] fetching tasks from sqlite db...");

      const batch = await getTasksFromOmniFocusDb(stopTime);

      isSyncCompleted = batch.length < TASK_FETCH_LIMIT;
      stopTime = batch.filter((t) => t.dateCompleted).last()?.dateCompleted;

      taskRecords.push(...batch);
      console.debug(
        `[OmniFocus Logbook] fetched ${batch.length} tasks from sqlite db`
      );
    }
  } catch (err) {
    console.error("[OmniFocus Logbook] Failed to query the OmniFocus SQLite DB", err);
    throw new OmniFocusSQLiteSyncError("fetch Tasks failed");
  }

  return taskRecords;
}

export async function getChecklistItemsFromOmniFocusLogbook(
  latestSyncTime: number
): Promise<IChecklistItemRecord[]> {
  const checklistItems: IChecklistItemRecord[] = [];
  let isSyncCompleted = false;
  let stopTime = unixToOmniFocusTimestamp(latestSyncTime);

  try {
    while (!isSyncCompleted) {
      console.debug(
        "[OmniFocus Logbook] fetching checklist items from sqlite db..."
      );

      const batch = await getChecklistItemsOmniFocusDb(stopTime);

      isSyncCompleted = batch.length < TASK_FETCH_LIMIT;
      stopTime = batch.filter((t) => t.dateCompleted).last()?.dateCompleted;

      checklistItems.push(...batch);
      console.debug(
        `[OmniFocus Logbook] fetched ${batch.length} checklist items from sqlite db`
      );
    }
  } catch (err) {
    console.error("[OmniFocus Logbook] Failed to query the OmniFocus SQLite DB", err);
    throw new OmniFocusSQLiteSyncError("fetch Subtasks failed");
  }

  return checklistItems;
}
