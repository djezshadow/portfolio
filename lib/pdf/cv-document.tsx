import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 44, backgroundColor: "#0d0d13", color: "#f3f1ff", fontSize: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  photo: { width: 64, height: 64, borderRadius: 32, marginRight: 16 },
  name: { fontSize: 20, marginBottom: 2 },
  specialty: { fontSize: 11, color: "#7c5cff", marginBottom: 6 },
  contactLine: { fontSize: 8.5, color: "#a9a6c2" },
  socialRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  socialChip: { flexDirection: "row", alignItems: "center", fontSize: 8, color: "#f3f1ff", backgroundColor: "#241f38", borderRadius: 10, paddingVertical: 2, paddingHorizontal: 7 },
  sectionTitle: { fontSize: 12, color: "#7c5cff", marginTop: 18, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  bio: { fontSize: 9.5, color: "#d9d7e8", lineHeight: 1.5, marginBottom: 4 },
  entry: { marginBottom: 10 },
  entryTitleRow: { flexDirection: "row", justifyContent: "space-between" },
  entryTitle: { fontSize: 10.5 },
  entryMeta: { fontSize: 8.5, color: "#a9a6c2" },
  entryCompany: { fontSize: 9, color: "#a9a6c2", marginTop: 1 },
  entryDesc: { fontSize: 9, color: "#c9c6dc", marginTop: 3, lineHeight: 1.4 },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  skillChip: { fontSize: 8.5, color: "#d9d7e8", backgroundColor: "#1a1826", borderRadius: 10, paddingVertical: 3, paddingHorizontal: 8, marginRight: 6, marginBottom: 6 },
  categoryLabel: { fontSize: 9, color: "#f3f1ff", backgroundColor: "#241f38", paddingVertical: 3, paddingHorizontal: 7, borderRadius: 4, marginTop: 8, marginBottom: 5, alignSelf: "flex-start" },
  footer: { position: "absolute", bottom: 28, left: 44, right: 44, fontSize: 7.5, color: "#6b6885", textAlign: "center" },
});

function formatDate(d: Date | null, ongoing: boolean, locale: "es" | "en"): string {
  if (ongoing) return locale === "en" ? "Present" : "Actualidad";
  if (!d) return "";
  return d.toLocaleDateString(locale === "en" ? "en-US" : "es-AR", { month: "short", year: "numeric" });
}

export type CvEntry = {
  title: string;
  subtitle: string | null;
  description: string | null;
  dateStart: Date | null;
  dateEnd: Date | null;
  isOngoing: boolean;
};

export type CvCategoryGroup = {
  categoryName: string;
  entries: CvEntry[];
};

export type CvData = {
  fullName: string;
  specialty: string | null;
  bio: string | null;
  photoUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  instagram: string | null;
  linkedin: string | null;
  skills: string[];
  experience: CvEntry[];
  /// Proyectos agrupados por categoría (item: "que se muestren los
  /// proyectos en su categoría, y todas las subcategorías también" —
  /// cada entry ya trae el nombre de sus subcategorías metido en el
  /// subtitle).
  projectsByCategory: CvCategoryGroup[];
  locale: "es" | "en";
};

export function CvDocument({ data }: { data: CvData }) {
  const t = {
    experience: data.locale === "en" ? "Experience" : "Experiencia",
    portfolio: data.locale === "en" ? "Portfolio work" : "Trabajos del portfolio",
    skills: data.locale === "en" ? "Skills" : "Aptitudes",
  };

  const contactBits = [data.email, data.phone, data.address, data.website].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {data.photoUrl && <Image src={data.photoUrl} style={styles.photo} />}
          <View>
            <Text style={styles.name}>{data.fullName || "DJEZSHADOW"}</Text>
            {data.specialty && <Text style={styles.specialty}>{data.specialty}</Text>}
            {contactBits.length > 0 && <Text style={styles.contactLine}>{contactBits.join("  ·  ")}</Text>}
            {(data.instagram || data.linkedin) && (
              <View style={styles.socialRow}>
                {data.instagram && <Text style={styles.socialChip}>IG · @{data.instagram}</Text>}
                {data.linkedin && <Text style={styles.socialChip}>in · {data.linkedin}</Text>}
              </View>
            )}
          </View>
        </View>

        {data.bio && <Text style={styles.bio}>{data.bio}</Text>}

        {data.projectsByCategory.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{t.portfolio}</Text>
            {data.projectsByCategory.map((group, gi) => (
              <View key={gi}>
                <Text style={styles.categoryLabel}>{group.categoryName}</Text>
                {group.entries.map((p, i) => (
                  <View key={i} style={styles.entry} wrap={false}>
                    <View style={styles.entryTitleRow}>
                      <Text style={styles.entryTitle}>{p.title}</Text>
                      <Text style={styles.entryMeta}>
                        {formatDate(p.dateStart, false, data.locale)}
                        {(p.dateStart || p.dateEnd || p.isOngoing) ? " — " : ""}
                        {formatDate(p.dateEnd, p.isOngoing, data.locale)}
                      </Text>
                    </View>
                    {p.subtitle && <Text style={styles.entryCompany}>{p.subtitle}</Text>}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {data.skills.length > 0 && (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>{t.skills}</Text>
            <View style={styles.skillsWrap}>
              {data.skills.map((s, i) => (
                <Text key={i} style={styles.skillChip}>
                  {s}
                </Text>
              ))}
            </View>
          </View>
        )}

        {data.experience.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>{t.experience}</Text>
            {data.experience.map((e, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <View style={styles.entryTitleRow}>
                  <Text style={styles.entryTitle}>{e.title}</Text>
                  <Text style={styles.entryMeta}>
                    {formatDate(e.dateStart, false, data.locale)}
                    {(e.dateStart || e.dateEnd || e.isOngoing) ? " — " : ""}
                    {formatDate(e.dateEnd, e.isOngoing, data.locale)}
                  </Text>
                </View>
                {e.subtitle && <Text style={styles.entryCompany}>{e.subtitle}</Text>}
                {e.description && <Text style={styles.entryDesc}>{e.description}</Text>}
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer} fixed>
          {data.locale === "en" ? "Generated on" : "Generado el"} {new Date().toLocaleDateString(data.locale === "en" ? "en-US" : "es-AR")}
        </Text>
      </Page>
    </Document>
  );
}
