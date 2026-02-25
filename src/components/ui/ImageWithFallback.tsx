'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { clsx } from 'clsx';

interface ImageWithFallbackProps extends Omit<ImageProps, 'src'> {
    srcWebp: string;
    srcPng: string;
    containerClassName?: string;
}

export function ImageWithFallback({ srcWebp, srcPng, alt, className, containerClassName, ...props }: ImageWithFallbackProps) {
    const [imgSrc, setImgSrc] = useState<string>(srcWebp);
    const [hasError, setHasError] = useState(false);

    // Reset state if webp source changes
    useEffect(() => {
        setImgSrc(srcWebp);
        setHasError(false);
    }, [srcWebp]);

    return (
        <div className={clsx("relative flex items-center justify-center", props.fill && "w-full h-full", containerClassName)}>
            <Image
                {...props}
                src={imgSrc}
                alt={alt}
                className={clsx("object-contain transition-opacity duration-300", className, hasError ? "opacity-0" : "opacity-100")}
                onError={() => {
                    if (!hasError) {
                        setHasError(true);
                        setImgSrc(srcPng);
                        // Small timeout to allow the new src to load before fading back in
                        setTimeout(() => setHasError(false), 50);
                    }
                }}
                unoptimized // We use raw files from public
            />
        </div>
    );
}
