const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Client } = require("pg");

const PORT = process.env.PORT || 5000;

const client = new Client({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: process.env.DATABASE_PORT
});
client.connect()
    .then(() => console.log("Database Connected"))
    .catch((error) => console.error("DB Connection Error:", error.message));

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({ message: "Server running successfully" });
});
//get task
app.get("/tasks", async (req, res) => {
    try {
        const query = `
            SELECT 
                t.task_id, t.task_name, t.description, t.status, t.priority,
                t.start_time, t.end_time, o.operator_id, o.operator_name
            FROM task t
            JOIN operator o ON t.operator_id = o.operator_id
        `;
        const result = await client.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching tasks:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
//post-task
app.post("/add-task", async (req, res) => {
    try {
        const {
            task_name,
            description,
            operator_id,
            start_time,
            end_time,
            status,
            priority
        } = req.body;

        // Basic validation
        if (!task_name || !operator_id || !start_time || !end_time || !status || !priority) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const insertQuery = `
            INSERT INTO task 
                (task_name, description, operator_id, start_time, end_time, status, priority)
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;

        const values = [
            task_name,
            description,
            operator_id,
            start_time,
            end_time,
            status,
            priority
        ];

        const result = await client.query(insertQuery, values);

        res.status(201).json({
            message: "Task created successfully",
            task: result.rows[0]
        });

    } catch (error) {
        console.error("Error adding task:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
//Update status by operator_id
app.put("/update-status/:operator_id", async (req, res) => {
    const operatorId = req.params.operator_id;
    const { status } = req.body;
    const validStatuses = ['pending', 'in_progress', 'completed'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    try {
        const result = await client.query(
            `UPDATE task SET status = $1 WHERE operator_id = $2 RETURNING *`,
            [status, operatorId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "No task found for the given operator ID" });
        }

        res.status(200).json({
            message: "Task status updated successfully",
            updatedTask: result.rows
        });
    } catch (error) {
        console.error("Error updating task status:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// DELETE task by task_id
app.delete("/delete-task/:task_id", async (req, res) => {
    const { task_id } = req.params;

    try {
        const deleteQuery = "DELETE FROM task WHERE task_id = $1";
        const result = await client.query(deleteQuery, [task_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
//add-log
app.post("/add-log", async (req, res) => {
    try {
        const { machine_id, operator_id, issue, issue_description } = req.body;


        if (issue === true && (!issue_description || issue_description.trim() === "")) {
            return res.status(400).json({ error: "Please enter the issue description" });
        }
        const finalDescription = issue === false ? "None" : issue_description;

        const query = `
            INSERT INTO incident_log (machine_id, operator_id, issue, issue_description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;

        const values = [machine_id, operator_id, issue, finalDescription];

        const result = await client.query(query, values);

        res.status(201).json({
            message: "Incident log added successfully",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Error adding incident log:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
//get-logs based on machine id
app.get("/get-logs/:machine_id", async (req, res) => {
    try {
        const { machine_id } = req.params;

        const query = `
            SELECT * FROM incident_log
            WHERE machine_id = $1
            ORDER BY log_time DESC;
        `;

        const result = await client.query(query, [machine_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No incident logs found for the given machine ID" });
        }

        res.status(200).json({
            message: "Incident logs fetched successfully",
            data: result.rows,
        });
    } catch (error) {
        console.error("Error fetching incident logs:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
//get machines info
app.get("/get-machines/:machine_id", async (req, res) => {
    const { machine_id } = req.params;

    try {
        const query = `SELECT * FROM machines WHERE machine_id = $1`;
        const values = [machine_id];

        const result = await client.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Machine not found" });
        }

        res.status(200).json({
            message: "Machine details fetched successfully",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Error fetching machine details:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
