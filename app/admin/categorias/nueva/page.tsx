import { CategoryForm } from "@/components/admin/category-form";
import { createCategory } from "../actions";

export default function NewCategoryPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="mb-8 font-display text-3xl">Nueva categoría</h1>
      <CategoryForm action={createCategory} submitLabel="Crear categoría" />
    </div>
  );
}
