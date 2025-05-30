import { Post } from "@/app/types/blog";
import SidebarWidgetFactory from "../widgets/SidebarWidgetFactory";
import { Widget } from "@/app/types/widgets";

interface BlogSidebarProps {
  posts: Post[];
  widgets: Widget[];
}

export default function BlogSidebar({ posts, widgets }: BlogSidebarProps) {
  const sortedWidgets = [...(widgets || [])].sort((a, b) => a.order - b.order);

  if (!widgets?.length) {
    return (
      <div className="bg-gray-50 p-4 rounded">
        <p className="text-gray-500">No widgets configured</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedWidgets.map((widget, index) => (
        <SidebarWidgetFactory
          key={`${widget._type}-${index}`}
          widget={widget}
          posts={posts}
        />
      ))}
    </div>
  );
}
