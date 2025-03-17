// Function to calculate Jaccard Similarity
function jaccardSimilarity(setA, setB) {
    const intersection = new Set([...setA].filter(tag => setB.has(tag)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
}

// Function to recommend similar items (Content-Based Filtering)
function recommendSimilarItems(targetItemId, menuItems) {
    const targetItem = menuItems.find(item => item._id.toString() === targetItemId.toString());
    if (!targetItem) return []; // Handle case where target item is not found

    const targetTags = new Set(targetItem.tags);

    const similarities = [];
    menuItems.forEach(item => {
        if (item._id.toString() !== targetItemId.toString()) {
            const itemTags = new Set(item.tags);
            const similarity = jaccardSimilarity(targetTags, itemTags);
            similarities.push({ itemId: item._id, similarity });
        }
    });

    // Sort by similarity and return top 5 items
    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
}

// Function to calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magnitudeA += vecA[i] * vecA[i];
        magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    return dotProduct / (magnitudeA * magnitudeB);
}

// Function to recommend items for a user (Collaborative Filtering)
function recommendItems(targetUserId, orders, menuItems) {

    // Create a user-item matrix
    const users = [...new Set(orders.map(order => order.customerId.toString()))];
    const items = menuItems.map(item => item._id.toString());
    const userItemMatrix = users.map(user => 
        items.map(item => 
            orders.some(order => order.customerId.toString() === user && order.items.some(i => i.productId.toString() === item)) ? 1 : 0
        )
    );

    console.log("User:", users);
    console.log('User-Item Matrix:', userItemMatrix);

    // Find the target user's index
    const targetUserIndex = users.indexOf(targetUserId.toString());
    console.log('Target User Index:', targetUserIndex);

    // Calculate similarity with other users
    const similarities = [];
    for (let i = 0; i < users.length; i++) {
        if (i !== targetUserIndex) {
            const targetVector = userItemMatrix[targetUserIndex];
            const userVector = userItemMatrix[i];

            // Skip if either vector has a magnitude of 0
            const targetMagnitude = Math.sqrt(targetVector.reduce((sum, val) => sum + val * val, 0));
            const userMagnitude = Math.sqrt(userVector.reduce((sum, val) => sum + val * val, 0));

            if (targetMagnitude === 0 || userMagnitude === 0) {
                console.log(`Skipping user ${users[i]} due to zero magnitude.`);
                continue;
            }

            const similarity = cosineSimilarity(targetVector, userVector);
            if (!isNaN(similarity)) {
                similarities.push({ userId: users[i], similarity });
            }
        }
    }
    console.log('Similarities:', similarities);

    // Sort by similarity and get top 3 similar users
    const topN = similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
    console.log('Top-N Similar Users:', topN);

    // Recommend items from similar users
    const recommendations = new Set();
    topN.forEach(user => {
        const userIndex = users.indexOf(user.userId);
        userItemMatrix[userIndex].forEach((item, index) => {
            if (item === 1 && userItemMatrix[targetUserIndex][index] === 0) {
                recommendations.add(items[index]);
            }
        });
    });
    console.log('Recommendations:', recommendations);

    return Array.from(recommendations);
}

// Function to combine content-based and collaborative filtering (Hybrid Recommendations)
function hybridRecommendations(targetUserId, targetItemId, orders, menuItems) {
    console.log('Target User:', targetUserId);
    console.log('Target Item:', targetItemId);

    // Get collaborative filtering recommendations
    const collaborativeRecs = recommendItems(targetUserId, orders, menuItems);
    console.log('Collaborative Recommendations:', collaborativeRecs);

    // Get content-based filtering recommendations
    const contentBasedRecs = recommendSimilarItems(targetItemId, menuItems).map(item => item.itemId);
    console.log('Content-Based Recommendations:', contentBasedRecs);

    // Combine and deduplicate recommendations
    const recommendations = [...new Set([...collaborativeRecs, ...contentBasedRecs])];
    console.log('Combined Recommendations:', recommendations);
    return recommendations;
}

module.exports = {
    hybridRecommendations,
};