const axios = require("axios");
require("dotenv").config();

const groqApiKey = process.env.GROQ_API_KEY || "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";

// Function to Generate Tags
async function generateTags(name, description) {
    const text = `${name} - ${description}`;

    const candidateLabels = [
        // Meal Categories
        'Appetizer', 'Main Course', 'Side Dish', 'Dessert', 'Beverage', 'Snack', 'Combo Meal', 
        'Brunch', 'Midnight Snack', 'Breakfast', 'Lunch', 'Dinner', 'Finger Food', 'Platter', 
        'Soup', 'Salad', 'Set Meal', 'Street Snack', 'Light Meal', 'Rice Meal',
    
        // Cuisine Types
        'Filipino', 'Asian', 'Western', 'Street Food', 'Carinderia Special', 'Fast Food', 
        'Turo-Turo', 'Lutong Bahay', 'Fusion Cuisine', 'Mediterranean', 'Korean', 'Japanese', 
        'Italian', 'Mexican', 'American', 'Chinese', 'Thai', 'Vietnamese', 'Indian', 'Spanish', 
        'Middle Eastern', 'Greek', 'French', 'Indonesian', 'Hawaiian',
    
        // Cooking Methods
        'Fried', 'Grilled', 'Boiled', 'Steamed', 'Baked', 'Roasted', 'Sautéed', 'Braised', 
        'Stewed', 'Deep-Fried', 'Air-Fried', 'Smoked', 'Sous Vide', 'Blanched', 'Broiled', 
        'Poached', 'Raw', 'Pickled', 'Seared', 'Pressure Cooked', 'Slow Cooked', 'Marinated',
    
        // Key Ingredients
        'Rice-Based', 'Noodles', 'Bread', 'Meat', 'Seafood', 'Chicken', 'Beef', 'Pork', 
        'Vegetables', 'Egg-Based', 'Dairy-Based', 'Coconut-Based', 'Sago', 'Gulaman', 'Ube', 
        'Chocolate', 'Coffee', 'Tea', 'Condensed Milk', 'Corn', 'Tapioca', 'Peanuts', 'Mango', 
        'Banana', 'Pineapple', 'Avocado', 'Tofu', 'Mushrooms', 'Quinoa', 'Oats', 'Pasta', 
        'Cheese', 'Butter', 'Yogurt', 'Milk', 'Tomato-Based', 'Garlic', 'Onion', 'Ginger', 
        'Lemongrass', 'Chili', 'Liver-Based', 'Vinegar-Based', 'Soy-Based',
    
        // Filipino Dishes & Adapted Foreign Foods
        'Adobo', 'Sinigang', 'Kare-Kare', 'Sisig', 'Bulalo', 'Laing', 'Bicol Express', 
        'Dinuguan', 'Pinakbet', 'Lechon', 'Pancit', 'Lumpia', 'Tapsilog', 'Longsilog', 
        'Tocilog', 'Bangsilog', 'Hotsilog', 'Goto', 'Arroz Caldo', 'Champorado', 'Bihon', 
        'Palabok', 'Chicharon', 'Balut', 'Isaw', 'Tusok-Tusok', 'Shawarma', 'Siomai', 
        'Dimsum', 'Hopia', 'Siopao', 'Halo-Halo', 'Taho', 'Kwek-Kwek', 'Tokwa\'t Baboy', 
        'Puto', 'Bibingka', 'Pichi-Pichi', 'Turon', 'Banana Cue', 'Pandesal', 'Ensaymada', 
        'Leche Flan', 'Maja Blanca', 'Buko Pandan', 'Kutsinta', 'Yema', 'Polvoron', 'Pastillas', 
        'Sapin-Sapin', 'Camote Cue', 'Ginataan', 'Lomi', 'Mami', 'Pansit Canton', 'Pork BBQ', 
        'Embutido', 'Menudo', 'Mechado', 'Kaldereta', 'Tinola', 'Daing na Bangus', 
        'Crispy Pata', 'Tokneneng', 'Ginataang Langka', 'Paksiw', 'Dinengdeng', 'Tortang Talong', 
        'Gising-Gising', 'Kinilaw', 'Suman', 'Bicho-Bicho', 'Inasal', 'Chop Suey',
    
        // Flavor Profiles
        'Sweet', 'Savory', 'Spicy', 'Sour', 'Salty', 'Umami', 'Caramelized', 'Tangy', 
        'Garlic-Based', 'Ginger-Based', 'Soy-Based', 'Vinegar-Based', 'Herbaceous', 'Smoky', 
        'Nutty', 'Buttery', 'Crispy', 'Crunchy', 'Chewy', 'Creamy', 'Zesty', 'Fruity', 
        'Citrusy', 'Earthy', 'Mild', 'Bold', 'Fiery',
    
        // Serving Temperature
        'Hot', 'Cold', 'Iced', 'Frozen', 'Room Temperature', 'Warm', 'Chilled', 'Refreshing',
    
        // Beverage Types
        'Milk Tea', 'Fruit Juice', 'Coffee-Based', 'Tea-Based', 'Alcoholic', 'Non-Alcoholic', 
        'Syrup-Based', 'Carbonated', 'Sago-Gulaman', 'Samalamig', 'Iced Coffee', 'Milk-Based', 
        'Chocolate-Based', 'Calamansi Juice', 'Buko Juice', 'Smoothie', 'Shake', 'Craft Beer', 
        'Cocktail', 'Mocktail', 'Soft Drink', 'Energy Drink', 'Flavored Water', 'Yogurt Drink', 
        'Matcha-Based', 'Espresso', 'Latte', 'Cappuccino', 'Cold Brew', 'Lemonade', 'Ginger Tea',
    
        // Dietary & Health Labels
        'Vegan', 'Vegetarian', 'Gluten-Free', 'Lactose-Free', 'Keto', 'Low-Carb', 'Low-Fat', 
        'Dairy-Free', 'Nut-Free', 'Halal', 'Pescatarian', 'High-Protein', 'Street-Safe', 
        'Organic', 'Paleo', 'Whole30', 'Low-Sodium', 'Plant-Based', 'High-Fiber', 'Heart-Healthy', 
        'Diabetic-Friendly', 'Sugar-Free',
    
        // University Canteen & Food Culture
        'Budget Meal', 'Student-Friendly', 'Silog Meals', 'Value Meal', 'Eatery', 'Unlimited Rice', 
        'Merienda', 'Affordable', 'Rice Topping', 'On-the-Go', 'Quick-Serve', 'Grab-and-Go', 
        'Meal Prep', 'Packed Lunch', 'Family-Style', 'Buffet', 'Fast-Casual', 'Self-Service', 
        'Canteen Favorite', 'Bulk Order', 'Specialty Dish', 'Food Court', 'Dine-In', 'Takeout', 
        'Delivery Available'
    ];    

    const groqTags = await classifyGroq(text, candidateLabels);

    // Extract only labels for storage
    const labelsOnly = groqTags.map(tag => tag.label);

    return { groqTags, labelsOnly };  // Return both full and labels-only lists
}

// Groq Classification (Replacing OpenAI)
async function classifyGroq(text, candidateLabels) {
    try {
        const prompt = `Analyze the following food description:
        "${text}"
        Assign the most relevant categories from this list:
        ${candidateLabels.join(', ')}
        
        Return exactly 10 category tags that describe this item, along with a confidence score (0 to 1).
        Format: "tag1:score1, tag2:score2, tag3:score3".
        Please do not include extra text, explanations, or numbering, just the format.
        
        `;

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.1-8b-instant",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 100,
                temperature: 0.7
            },
            { headers: { Authorization: `Bearer ${groqApiKey}` } }
        );

        const output = response.data.choices[0].message.content;

        // Parse response into an array of { label, score }
        return output.split(',').map(pair => {
            const [label, score] = pair.trim().split(':');
            return { label: label.trim(), score: parseFloat(score) || 0 };
        });
    } catch (error) {
        console.error("Groq API Error:", error.response?.data || error.message);
        return [];
    }
}

// Example call
// generateTags("Lechon Kawali Rice Bowl", "Lechon kawali over rice, topped with sunny-side-up egg")
//     .then(console.log);

module.exports = generateTags;
