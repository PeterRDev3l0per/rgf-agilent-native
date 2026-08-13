import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskCard, { Task } from "./TaskCard";

interface SortableTaskCardProps {
  task: Task;
  isDragOverlay?: boolean;
  onClick?: (task: Task) => void;
}

const SortableTaskCard = ({ task, isDragOverlay = false, onClick }: SortableTaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    data: {
      type: "task",
      task,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // When being dragged, show skeleton placeholder
  if (isDragging && !isDragOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-[8px] p-4 opacity-30 border-2 border-dashed border-[rgba(255,255,255,0.2)] bg-transparent min-h-[120px]"
      />
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if it wasn't a drag
    if (!isDragging && onClick) {
      onClick(task);
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={handleClick}
    >
      <TaskCard 
        task={task} 
        isDragOverlay={isDragOverlay}
      />
    </div>
  );
};

export default SortableTaskCard;
