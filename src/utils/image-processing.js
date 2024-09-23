export async function loadAndSortImages(imageSources) {
  const imageInfos = await Promise.all(
    imageSources.map(async (src) => {
      const img = await loadImage(src);
      return {
        src,
        width: img.width,
        height: img.height,
        pixels: img.width * img.height,
      };
    }),
  );

  return imageInfos.sort((a, b) => a.pixels - b.pixels);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function calculateGridSize(level, totalLevels, width, height) {
  const aspectRatio = width / height;

  const difficulty = Math.min(
    5,
    Math.floor(3 + (level / (totalLevels - 1)) * 2),
  );

  if (aspectRatio > 1) {
    return {
      horizontal: difficulty,
      vertical: Math.max(3, Math.round(difficulty / aspectRatio)),
    };
  } else {
    return {
      horizontal: Math.max(3, Math.round(difficulty * aspectRatio)),
      vertical: difficulty,
    };
  }
}

export async function sliceImage(imageInfo, gridSize) {
  let img;
  if (typeof imageInfo.src === "string") {
    img = await createImageBitmap(
      await fetch(imageInfo.src).then((r) => r.blob()),
    );
  } else {
    img = await createImageBitmap(new Blob([imageInfo.src]));
  }

  const sliceWidth = img.width / gridSize.horizontal;
  const sliceHeight = img.height / gridSize.vertical;

  const slices = [];

  for (let y = 0; y < gridSize.vertical; y++) {
    for (let x = 0; x < gridSize.horizontal; x++) {
      const slice = await createImageBitmap(
        img,
        x * sliceWidth,
        y * sliceHeight,
        sliceWidth,
        sliceHeight,
      );
      slices.push(slice);
    }
  }

  return slices;
}
