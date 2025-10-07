export interface Task {
  title: string;
  subTasks: {
    title: string;
    isCompleted: boolean;
  }[];
  dueDate: Date;
  priority: string;
  status: string;
  assignedTo: string;
  category: string;
}
