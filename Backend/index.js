
import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const PORT = 5000;

try{
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
} catch (error) {
    console.log(error.message);
}