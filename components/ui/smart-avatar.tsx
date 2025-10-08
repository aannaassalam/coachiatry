"use client";

import * as React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/functions/_helpers.lib";

interface SmartAvatarProps {
  src?: string;
  name?: string;
  textSize?: string;
  className?: string;
}

export function SmartAvatar({
  src,
  name,
  textSize = "text-base",
  className
}: SmartAvatarProps) {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  return (
    <Avatar
      className={cn(
        "overflow-hidden border border-gray-100 bg-gray-100 relative",
        className
      )}
    >
      {/* Shimmer while loading only if src is provided */}
      {src && !loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}

      {/* Fade-in image */}
      {src && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <AvatarImage
            src={src}
            alt={name ?? "Avatar"}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className="object-cover w-full h-full"
          />
        </motion.div>
      )}

      {/* Fallback (initials or default icon) */}
      <AvatarFallback
        className={cn(
          "bg-orange-100 flex items-center justify-center font-semibold text-orange-600",
          textSize
        )}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
