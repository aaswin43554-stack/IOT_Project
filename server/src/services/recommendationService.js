function getCropRecommendation(ph, ec, moisture, nitrogen = 0, phosphorus = 0, potassium = 0) {
    // Basic NPK deficiency thresholds
    const lowN = nitrogen < 20;
    const lowP = phosphorus < 10;
    const lowK = potassium < 40;

    let previousCrop = 'Unknown';
    let nextCrop = [];
    let explanation = '';

    // Deduce previous crop and recommend recovery crop based on specific nutrient deficiencies
    if (lowN && !lowP && !lowK) {
        // Nitrogen depleted, P and K are okay
        previousCrop = 'Heavy Feeder (e.g., Maize, Corn, Sorghum)';
        nextCrop = ['Legumes (Beans, Peas)', 'Alfalfa'];
        explanation = 'Nitrogen is significantly depleted. The previous crop was likely a heavy feeder. Planting nitrogen-fixing legumes will naturally restore soil N levels.';
    } else if (lowP && !lowN && !lowK) {
        // Phosphorus depleted
        previousCrop = 'Root Crop (e.g., Carrots, Potatoes)';
        nextCrop = ['Leafy Greens (Lettuce, Spinach)', 'Green Manure'];
        explanation = 'Phosphorus drops often indicate heavy root or tuber farming. Rotate with leafy greens or use a green manure cover crop to rest the phosphorus layers.';
    } else if (lowK && !lowN && !lowP) {
        // Potassium depleted
        previousCrop = 'Fruiting/Flowering Crop (e.g., Tomatoes, Peppers)';
        nextCrop = ['Deep Rooted Crops', 'Root Vegetables'];
        explanation = 'Potassium is vital for fruit and flower production. The low K suggests a fruiting harvest. Rotate with deep-rooted crops to access deeper nutrient profiles.';
    } else if (lowN && lowP && lowK) {
        // All nutrients depleted
        previousCrop = 'Intensive Cash Crop (e.g., Cotton, Sugarcane)';
        nextCrop = ['Cover Crops (Clover, Rye)', 'Fallow'];
        explanation = 'Soil is highly degraded across all major macronutrients. A resting period with cover crops is strongly recommended to rebuild soil health.';
    } else if (!lowN && !lowP && !lowK) {
        // Balanced/Good nutrients
        previousCrop = 'Nitrogen-Fixing Legumes or Fallow';
        nextCrop = ['Heavy Feeders (Wheat, Corn, Rice)', 'Tomatoes'];
        explanation = 'Soil macronutrients (NPK) are excellent! The soil was likely rested or fixed recently. You can safely plant heavy-feeding cash crops.';
    } else {
        // Mixed deficiencies, fallback to older environmental logic but mention rotation
        previousCrop = 'Mixed Farming';

        if (ph >= 6.0 && ph <= 7.5 && ec < 1.0) {
            nextCrop = ['Rice (Paddy)', 'Maize', 'Groundnut'];
            explanation = 'NPK is irregular but pH and salinity are optimal. Suitable for starch crops and legumes. Consider targeted fertilization.';
        } else if (ph < 6.0) {
            nextCrop = ['Tea', 'Coffee', 'Rubber'];
            explanation = 'Acidic soil environment. Typical for hilly regions. Treat specific NPK deficiencies before planting.';
        } else if (ec >= 1.0) {
            nextCrop = ['Coconut', 'Cotton', 'Barley'];
            explanation = 'Salinity tolerant crops recommended due to high EC. Ensure adequate Potassium to mitigate salt stress.';
        } else {
            nextCrop = ['Millet', 'Pulses', 'Sunflower'];
            explanation = 'General hardy crops suitable for current conditions. Use targeted NPK amendments based on the exact deficiencies.';
        }
    }

    return {
        previousCrop,
        recommendedCrops: nextCrop,
        explanation
    };
}
module.exports = { getCropRecommendation };
