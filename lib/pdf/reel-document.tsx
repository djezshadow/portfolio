import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Fuentes estándar del sistema de @react-pdf (no dependen de internet en build).
const styles = StyleSheet.create({
  page: { padding: 48, backgroundColor: "#0d0d13", color: "#f3f1ff" },
  brand: { fontSize: 22, marginBottom: 4, letterSpacing: 1 },
  tagline: { fontSize: 10, color: "#a9a6c2", marginBottom: 28 },
  categoryTitle: { fontSize: 14, color: "#7c5cff", marginTop: 18, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: "#2a2838" },
  projectTitle: { fontSize: 11 },
  projectMeta: { fontSize: 9, color: "#a9a6c2" },
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, fontSize: 8, color: "#6b6885", textAlign: "center" },
});

export type ReelCategory = {
  name: string;
  projects: { title: string; role: string | null; collaboratorName: string | null; subcategories?: string[] }[];
};

export function ReelDocument({ categories }: { categories: ReelCategory[] }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>DJEZSHADOW®</Text>
        <Text style={styles.tagline}>Portfolio de filmmaking — reel generado automáticamente</Text>

        {categories.map((cat) => (
          <View key={cat.name} wrap={false}>
            <Text style={styles.categoryTitle}>{cat.name.toUpperCase()}</Text>
            {cat.projects.map((p, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.projectTitle}>{p.title}</Text>
                <Text style={styles.projectMeta}>
                  {[p.role, p.collaboratorName, p.subcategories && p.subcategories.length > 0 ? p.subcategories.join(", ") : null]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <Text style={styles.footer} fixed>
          © {new Date().getFullYear()} DJEZSHADOW® — generado el {new Date().toLocaleDateString("es-AR")}
        </Text>
      </Page>
    </Document>
  );
}
