export const generateDescription = async (productName: string, keywords: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, keywords }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Server error' }));
        if (process.env.NODE_ENV !== 'production') {
            console.error("API Error:", errorData.error);
        }
        throw new Error(errorData.error || 'Server error');
    }

    const data = await response.json();
    return data.description || getFallbackDescription(productName, keywords);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
        console.error("Error fetching description:", error);
    }
    return getFallbackDescription(productName, keywords);
  }
};

const getFallbackDescription = (productName: string, keywords: string): string => {
  const keywordList = keywords?.split(',').map(k => k.trim()).filter(Boolean) || ['delicioso', 'fresco'];
  return `${productName} - ${keywordList.join(', ')}. Producto de calidad disponible en nuestra cafetería.`;
};

export const generateImage = async (productName: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Server error' }));
        if (process.env.NODE_ENV !== 'production') {
            console.error("API Error:", errorData.error);
        }
        throw new Error(errorData.error || 'Server error');
    }

    const data = await response.json();
    return data.imageUrl || getFallbackImage(productName);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
        console.error("Error fetching image:", error);
    }
    return getFallbackImage(productName);
  }
};

const getFallbackImage = (productName: string): string => {
  // Use a more reliable placeholder service with the product name as seed
  const seed = encodeURIComponent(productName.toLowerCase().replace(/\s+/g, '-'));
  return `https://picsum.photos/seed/${seed}/400/300`;
};
