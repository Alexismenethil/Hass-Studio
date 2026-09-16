import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Link,
} from "@react-email/components";
export type UpdateEmailProps = {
  brand: string;
  project: string;
  title: string;
  message: string;
  progress: number;
  language: "en" | "es";
  previewUrl?: string;
  files?: { name: string; url: string }[];
};
export function ProjectUpdateEmail({
  brand,
  project,
  title,
  message,
  progress,
  language,
  previewUrl,
  files = [],
}: UpdateEmailProps) {
  const es = language === "es";
  return (
    <Html lang={language}>
      <Head />
      <Preview>{project + " — " + title}</Preview>
      <Body
        style={{
          background: "#f4f1e9",
          margin: 0,
          fontFamily: "Arial, sans-serif",
          color: "#33362b",
        }}
      >
        <Container style={{ maxWidth: 580, padding: "48px 28px" }}>
          <Text
            style={{
              fontFamily: "Georgia,serif",
              fontSize: 28,
              letterSpacing: 2,
            }}
          >
            {brand}
          </Text>
          <Hr style={{ borderColor: "#d3d5cb", margin: "30px 0" }} />
          <Text
            style={{
              fontSize: 10,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {es ? "Actualización del proyecto" : "Project update"} / {project}
          </Text>
          <Heading
            style={{
              fontFamily: "Georgia,serif",
              fontWeight: 400,
              fontSize: 35,
              lineHeight: 1.15,
              margin: "25px 0",
            }}
          >
            {title}
          </Heading>
          <Section
            style={{
              padding: "16px 20px",
              background: "#e2e4db",
              margin: "25px 0",
            }}
          >
            <Text style={{ margin: 0, fontSize: 13 }}>
              {es ? "Progreso" : "Progress"} — <strong>{progress}%</strong>
            </Text>
            <div style={{ height: 3, background: "#c4c7b9", marginTop: 12 }}>
              <div
                style={{
                  width: progress + "%",
                  height: 3,
                  background: "#5e644a",
                }}
              />
            </div>
          </Section>
          {message.split("\n").map((p, i) => (
            <Text
              key={i}
              style={{ fontSize: 14, lineHeight: 1.8, margin: "12px 0" }}
            >
              {p || " "}
            </Text>
          ))}
          {previewUrl && (
            <Link
              href={previewUrl}
              style={{
                display: "inline-block",
                background: "#33362b",
                color: "#fff",
                padding: "14px 22px",
                borderRadius: 25,
                margin: "20px 0",
                fontSize: 12,
              }}
            >
              {es ? "Ver proyecto" : "View project"} →
            </Link>
          )}
          {files.length > 0 && (
            <Section>
              <Text style={{ fontSize: 11 }}>
                {es
                  ? "Archivos compartidos (disponibles durante 7 días)"
                  : "Shared files (available for 7 days)"}
              </Text>
              {files.map((f) => (
                <Text key={f.url}>
                  <Link href={f.url} style={{ color: "#555c3e", fontSize: 12 }}>
                    {f.name} ↗
                  </Link>
                </Text>
              ))}
            </Section>
          )}
          <Hr style={{ borderColor: "#d3d5cb", margin: "35px 0 20px" }} />
          <Text style={{ fontSize: 11, color: "#7a7d6f" }}>
            {es
              ? "Diseñado con intención. Creado con cuidado."
              : "Thoughtfully designed. Carefully built."}
            <br />
            {brand}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
