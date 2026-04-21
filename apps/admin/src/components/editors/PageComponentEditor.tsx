'use client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useState } from 'react';
import { ComponentBlockForm } from './ComponentBlockForm';
import api from '@/lib/api';
import { PageComponentType } from '@krontech/types';

const COMPONENT_LABELS: Record<string, string> = {
  hero: 'Hero',
  text_block: 'Text Block',
  cta: 'CTA Banner',
  features_grid: 'Features Grid',
  faq: 'FAQ',
  media_block: 'Media Block',
  form_embed: 'Form Embed',
  hero_slider: 'Hero Slider',
  video: 'Video Section',
  stats_banner: 'Stats Banner',
  why_kron: 'Why Kron',
  contact_section: 'Contact Section',
  kuppinger_cole: 'KuppingerCole Badge',
  product_catalog: 'Product Catalog',
  blog_carousel: 'Blog Carousel',
};

interface PageComponent {
  id: string;
  type: string;
  order: number;
  data: Record<string, unknown>;
  hasDraft: boolean;
}

interface PageComponentEditorProps {
  pageId: string;
  initialComponents: PageComponent[];
  onDraftStateChange: (hasPending: boolean) => void;
}

function SortableComponentRow({
  component,
  onEdit,
  onDelete,
}: {
  component: PageComponent;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: component.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-3 bg-white border border-gray-200 px-3 py-2.5"
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to reorder"
        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
      >
        ⠿
      </button>
      <span className="text-xs font-mono text-gray-500 uppercase bg-gray-100 px-1.5 py-0.5">
        {component.type}
      </span>
      <span className="flex-1 text-sm text-gray-700 truncate">
        {(component.data.heading as { tr?: string } | undefined)?.tr ??
         (component.data.content as { tr?: string } | undefined)?.tr?.slice(0, 60) ??
         `Component #${component.order + 1}`}
      </span>
      {component.hasDraft && (
        <span
          title="Unsaved draft"
          className="inline-block w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"
        />
      )}
      <button
        type="button"
        onClick={onEdit}
        className="text-xs text-primary hover:underline"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="text-xs text-red-500 hover:underline"
      >
        Delete
      </button>
    </div>
  );
}

export function PageComponentEditor({ pageId, initialComponents, onDraftStateChange }: PageComponentEditorProps) {
  const [components, setComponents] = useState<PageComponent[]>(
    [...initialComponents].sort((a, b) => a.order - b.order)
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingType, setAddingType] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    onDraftStateChange(components.some(c => c.hasDraft));
  }, [components]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = components.findIndex(c => c.id === active.id);
    const newIndex = components.findIndex(c => c.id === over.id);
    const reordered = arrayMove(components, oldIndex, newIndex).map((c, i) => ({ ...c, order: i }));
    setComponents(reordered);

    try {
      await api.post('/pages/components/reorder', {
        pageId,
        components: reordered.map((c, i) => ({ id: c.id, order: i })),
      });
    } catch {
      setError('Failed to save order');
    }
  };

  const handleSaveComponent = async (id: string, data: Record<string, unknown>) => {
    try {
      const res = await api.patch<PageComponent>(`/pages/components/${id}`, { data });
      setComponents(prev => prev.map(c => c.id === id ? { ...res.data } : c));
      setEditingId(null);
    } catch {
      setError('Failed to save draft');
    }
  };

  const handleAddComponent = async (type: string, data: Record<string, unknown>) => {
    try {
      const res = await api.post<PageComponent>('/pages/components', {
        pageId,
        type,
        data,
        order: components.length,
      });
      setComponents(prev => [...prev, res.data]);
      setAddingType(null);
    } catch {
      setError('Failed to add component');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this component?')) return;
    try {
      await api.delete(`/pages/components/${id}`);
      setComponents(prev => prev.filter(c => c.id !== id));
    } catch {
      setError('Failed to delete component');
    }
  };

  return (
    <section aria-label="Page components">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">Page Components</h2>
        <div className="flex gap-2 items-center">
          <select
            value={addingType ?? ''}
            onChange={e => setAddingType(e.target.value || null)}
            className="border border-gray-300 px-2 py-1 text-xs focus:outline-none"
          >
            <option value="">+ Add component…</option>
            {Object.values(PageComponentType).map(t => (
              <option key={t} value={t}>{COMPONENT_LABELS[t] ?? t}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

      {/* Add component form */}
      {addingType && (
        <div className="border border-primary/30 bg-blue-50 p-4 mb-4">
          <p className="text-xs font-medium text-primary mb-3">New: {addingType}</p>
          <ComponentBlockForm
            type={addingType}
            onSave={(data) => handleAddComponent(addingType, data)}
            onCancel={() => setAddingType(null)}
          />
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(e) => { void handleDragEnd(e); }}
      >
        <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {components.map(component => (
              <div key={component.id}>
                <SortableComponentRow
                  component={component}
                  onEdit={() => setEditingId(editingId === component.id ? null : component.id)}
                  onDelete={() => { void handleDelete(component.id); }}
                />
                {editingId === component.id && (
                  <div className="border border-gray-200 border-t-0 bg-gray-50 p-4">
                    <ComponentBlockForm
                      type={component.type}
                      initialData={component.data}
                      onSave={(data) => handleSaveComponent(component.id, data)}
                      onCancel={() => setEditingId(null)}
                      saveLabel="Save Draft"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {components.length === 0 && !addingType && (
        <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-300">
          No components yet. Use the dropdown above to add one.
        </p>
      )}
    </section>
  );
}
