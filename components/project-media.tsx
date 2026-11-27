"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ProjectLightbox } from "./project-lightbox";
import { VideoEmbed } from "./video-embed";

type Project = React.ComponentProps<typeof ProjectLightbox>["project"];

export function ProjectMedia({ project, en }: { project: Project; en: boolean }) {
  const [open, setOpen] = useState(false);
  const video = project.media.find((media) => media.type === "video" && media.videoProvider && media.videoId);
  const images = project.media.filter((media) => media.type === "image");
  if (!project.media.length) return null;
  return <section className="space-y-5">
    {video?.videoProvider && video.videoId && <VideoEmbed provider={video.videoProvider} videoId={video.videoId} title={project.title} />}
    {!!images.length && <button type="button" onClick={() => setOpen(true)} className="glass min-h-11 rounded-full px-5">
      {en ? "Browse gallery" : "Abrir galería"}
    </button>}
    {!images.length && project.media.length > 1 && <button type="button" onClick={() => setOpen(true)} className="glass min-h-11 rounded-full px-5">
      {en ? "Browse all videos" : "Ver todos los videos"}
    </button>}
    <AnimatePresence>{open && <ProjectLightbox key="project-gallery" project={project} onClose={() => setOpen(false)} />}</AnimatePresence>
  </section>;
}
