import { useEffect } from 'react';

interface SEOProps {
    title: string;
    description: string;
    canonicalUrl?: string;
    image?: string;
}

export function SEO({ title, description, canonicalUrl, image }: SEOProps) {
    useEffect(() => {
        // Update title
        document.title = title;

        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', description);
        } else {
            const meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = description;
            document.head.appendChild(meta);
        }

        // Update Canonical URL
        let linkCanonical = document.querySelector('link[rel="canonical"]');
        const url = canonicalUrl || (window.location.origin + window.location.pathname);

        if (linkCanonical) {
            linkCanonical.setAttribute('href', url);
        } else {
            linkCanonical = document.createElement('link');
            linkCanonical.setAttribute('rel', 'canonical');
            linkCanonical.setAttribute('href', url);
            document.head.appendChild(linkCanonical);
        }

        // Update OG URL (same as canonical)
        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) {
            ogUrl.setAttribute('content', url);
        } else {
            const meta = document.createElement('meta');
            meta.setAttribute('property', 'og:url');
            meta.content = url;
            document.head.appendChild(meta);
        }

        // Update OG Image
        const ogImage = document.querySelector('meta[property="og:image"]');
        const imageUrl = image ? (image.startsWith('http') ? image : window.location.origin + image) : (window.location.origin + '/og-image.png');

        if (ogImage) {
            ogImage.setAttribute('content', imageUrl);
        } else {
            const meta = document.createElement('meta');
            meta.setAttribute('property', 'og:image');
            meta.content = imageUrl;
            document.head.appendChild(meta);
        }

        // Update OG title
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            ogTitle.setAttribute('content', title);
        }

        // Update OG description
        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) {
            ogDescription.setAttribute('content', description);
        }
    }, [title, description, canonicalUrl, image]);

    return null;
}
