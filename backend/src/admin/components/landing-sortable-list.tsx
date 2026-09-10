import { useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableRow({
  id,
  label,
  disabled,
  children,
}: {
  id: string;
  label: string;
  disabled: boolean;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });
  return (
    <div
      ref={setNodeRef}
      className="relative min-w-0"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
    >
      {children}
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${label}`}
        title="Drag to reorder. Or press Space, use arrow keys, then Space to drop."
        disabled={disabled}
        className="absolute right-1 top-1 flex h-11 w-11 touch-none items-center justify-center rounded-md text-ui-fg-muted hover:bg-ui-bg-base-hover hover:text-ui-fg-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-ui-border-interactive disabled:cursor-default disabled:opacity-30 cursor-grab active:cursor-grabbing"
      >
        <svg
          width="16"
          height="20"
          viewBox="0 0 16 20"
          fill="currentColor"
          aria-hidden="true"
        >
          {[4, 10, 16].flatMap((cy) =>
            [5, 11].map((cx) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.5" />
            ))
          )}
        </svg>
      </button>
    </div>
  );
}

export function LandingSortableList<T extends { id: string }>({
  items,
  label,
  getLabel,
  disabled = false,
  onReorder,
  children,
}: {
  items: T[];
  label: string;
  getLabel: (item: T) => string;
  disabled?: boolean;
  onReorder: (items: T[]) => void;
  children: (item: T, index: number) => ReactNode;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const activeItem = items.find((item) => item.id === activeId);
  const name = (id: string | number) => {
    const item = items.find((item) => item.id === id);
    return item ? getLabel(item) : "Item";
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "Press Space to pick up. Use the up and down arrow keys to reorder. Press Space to drop, or Escape to cancel.",
        },
        announcements: {
          onDragStart: ({ active }) => `Picked up ${name(active.id)}.`,
          onDragOver: ({ active, over }) =>
            over
              ? `${name(active.id)}, position ${
                  items.findIndex((item) => item.id === over.id) + 1
                } of ${items.length}.`
              : undefined,
          onDragEnd: ({ active, over }) =>
            over
              ? `${name(active.id)} dropped at position ${
                  items.findIndex((item) => item.id === over.id) + 1
                } of ${items.length}.`
              : "Reordering cancelled.",
          onDragCancel: () => "Reordering cancelled. Order unchanged.",
        },
      }}
      onDragStart={({ active }) => setActiveId(String(active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={({ active, over }) => {
        setActiveId(null);
        if (disabled || !over || active.id === over.id) return;
        const from = items.findIndex((item) => item.id === active.id);
        const to = items.findIndex((item) => item.id === over.id);
        if (from >= 0 && to >= 0) onReorder(arrayMove(items, from, to));
      }}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div role="group" aria-label={label} className="min-w-0 space-y-3">
          {items.map((item, index) => (
            <SortableRow
              key={item.id}
              id={item.id}
              label={getLabel(item)}
              disabled={disabled || items.length < 2}
            >
              {children(item, index)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeItem ? (
          <div className="rounded-lg border border-ui-border-interactive bg-ui-bg-base p-4 text-sm font-medium text-ui-fg-base shadow-elevation-flyout break-words cursor-grabbing">
            {getLabel(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
