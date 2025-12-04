async function detectPanorama(imageSrc)
{
	const known360Makers = [
		'RICOH', 'THETA',     // RICOH Theta
		'INSTA', 'INSTA360',  // Insta360
		'GO PRO', 'GOPRO',    // GoPro MAX
		'GARMIN',
		'PANASONIC', 'KODAK',
		'SAMSUNG', 'XIAOMI'
	];

	const RATIO_TOLERANCE = 0.1;
	const MIN_PANO_WIDTH = 2000;

	async function loadImageDims(src) 
	{
		return new Promise((resolve, reject) => 
		{
			const img = new Image();
			img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
			img.onerror = (e) => reject(new Error('Image load failed: ' + e + '!'));
			// Allow cross-origin for both fetching and canvas reads (if required)
			if (typeof src === 'string') img.crossOrigin = 'anonymous';
			if (src instanceof File) img.src = URL.createObjectURL(src);
			else img.src = src;
		});
	}

    async function fetchArrayBuffer(src) {
        if (src instanceof File) {
            return await src.arrayBuffer();
        } else {
            const res = await fetch(src, { mode: 'cors' });
            if (!res.ok) throw new Error('Network response was not OK!');
            return await res.arrayBuffer();
        }
    }

    // Extract XMP block from the binary blob
    function extractXMPfromBuffer(ab)
	{
        try
		{
            const text = new TextDecoder('utf-8', { fatal: false }).decode(ab);
            const start = text.indexOf('<x:xmpmeta');
            if (start === -1) return null;
            const end = text.indexOf('</x:xmpmeta>', start);
            if (end === -1) return text.slice(start);
            return text.slice(start, end + '</x:xmpmeta>'.length);
        }
		catch (e)
		{
            return null;
        }
    }

    // Parse GPano tags from XMP string
    function parseGPano(xmp)
	{
        if (!xmp) return null;
        const getTag = (tag) => {
            const re = new RegExp(`<GPano:${tag}>([^<]+)<\\/GPano:${tag}>`, 'i');
            const m = xmp.match(re);
            return m ? m[1] : null;
        };
        const projection = getTag('ProjectionType');
        const fullWidth = getTag('FullPanoWidthPixels') ? parseInt(getTag('FullPanoWidthPixels'), 10) : null;
        const fullHeight = getTag('FullPanoHeightPixels') ? parseInt(getTag('FullPanoHeightPixels'), 10) : null;
        const useViewer = getTag('UsePanoramaViewer');
        return { projection, fullWidth, fullHeight, useViewer };
    }

    // Try to read exif using exifr
    async function readExifFromBuffer(ab)
	{
        if (!window.exifr) return null;
        try
		{
            // exifr.parse accepts ArrayBuffer or Blob; returns object with Make, Model, etc.
            const exif = await exifr.parse(ab, { translateValues: true }).catch(() => null);
            return exif || null;
        }
		catch (e)
		{
            return null;
        }
    }

    let dims = null;
    try
	{
        dims = await loadImageDims(imageSrc);
    }
	catch (e)
	{
        console.warn('Could not load image dimensions for', imageSrc, ": " , e, '!');
    }

    // Try to fetch bytes and inspect XMP / EXIF
    let arrayBuffer = null;
    let xmp = null;
    let gpano = null;
    let exif = null;
    try
	{
        arrayBuffer = await fetchArrayBuffer(imageSrc);
        xmp = extractXMPfromBuffer(arrayBuffer);
        gpano = parseGPano(xmp);

        // GPano check (ProjectionType or FullPano dims)
        if (gpano)
		{
            if (gpano.projection && gpano.projection.toLowerCase() === 'equirectangular')
			{
                return { isPanorama: true, reason: 'GPano:ProjectionType', gpano, exif: null, dims };
            }
			
            // If fullWidth/fullHeight present, check ratio
            if (gpano.fullWidth && gpano.fullHeight) 
			{
                const gRatio = gpano.fullWidth / gpano.fullHeight;
                if (Math.abs(gRatio - 2) < 0.2) 
				{
                    return { isPanorama: true, reason: 'GPano:FullPanoSize', gpano, exif: null, dims };
                }
            }
        }

        // EXIF check (Make/Model)
        exif = await readExifFromBuffer(arrayBuffer);
        if (exif && exif.Make) 
		{
            const make = String(exif.Make).toUpperCase();
            const model = exif.Model ? String(exif.Model).toUpperCase() : '';
            for (const k of known360Makers) 
			{
                if (make.includes(k) || model.includes(k))
				{
                    return { isPanorama: true, reason: 'EXIF:Make/Model', gpano, exif, dims };
                }
            }
        }
    } 
	catch (err) 
	{
        // fallback to aspect ratio
        console.warn('Could not fetch/parse image bytes (CORS or network)! Falling back to aspect-ratio for', imageSrc, ": " , e, '!');
    }

    // Aspect-ratio fallback
    if (dims) 
	{
        const ratio = dims.w / dims.h;
        if (Math.abs(ratio - 2) < RATIO_TOLERANCE && dims.w >= MIN_PANO_WIDTH) 
		{
            return { isPanorama: true, reason: 'AspectRatio', gpano, exif, dims, ratio };
        }
    }

    // If no match
    return { isPanorama: false, reason: 'NoneMatched', gpano, exif, dims };

}