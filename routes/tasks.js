const express = require("express");
const router = express.Router();
const { Task } = require("../models/tasks");
const { requireLogin } = require("../middleware/auth");  


router.get("/dashboard", requireLogin, async (req, res) => {
    try {
        const tasks = await Task.count({
            where: { userId: req.session.user.id }
        });

        const completed = await Task.count({
            where: { userId: req.session.user.id, status: "completed" }
        });

        res.render("dashboard", {
            user: req.session.user,
            stats: {
                total: tasks,
                completed,
                pending: tasks - completed
            }
        });
    } catch (err) {
        console.log(err);
        res.send("Error loading dashboard");
    }
});


router.get("/", requireLogin, async (req, res) => {
    try {
        const tasks = await Task.findAll({
            where: { userId: req.session.user.id },
            order: [["createdAt", "DESC"]]
        });

        res.render("tasks", { tasks });
    } catch (err) {
        console.log(err);
        res.send("Error loading tasks");
    }
});


router.get("/add", requireLogin, (req, res) => {
    res.render("tasks_add");
});


router.post("/add", requireLogin, async (req, res) => {
    const { title, description, dueDate, status } = req.body;

    try {
        await Task.create({
            title,
            description,
            dueDate,
            status: status || "pending",
            userId: req.session.user.id
        });

        res.redirect("/tasks");
    } catch (err) {
        console.log(err);
        res.render("tasks_add", { error: "Failed to create task" });
    }
});


router.get("/edit/:id", requireLogin, async (req, res) => {
    try {
        const task = await Task.findOne({
            where: { id: req.params.id, userId: req.session.user.id }
        });

        if (!task) return res.redirect("/tasks");

        res.render("tasks_edit", { task });
    } catch (err) {
        console.log(err);
        res.send("Error loading edit page");
    }
});


router.post("/edit/:id", requireLogin, async (req, res) => {
    const { title, description, dueDate, status } = req.body;

    try {
        await Task.update(
            { title, description, dueDate, status },
            { where: { id: req.params.id, userId: req.session.user.id } }
        );

        res.redirect("/tasks");
    } catch (err) {
        console.log(err);
        res.send("Error updating task");
    }
});


router.post("/delete/:id", requireLogin, async (req, res) => {
    try {
        await Task.destroy({
            where: { id: req.params.id, userId: req.session.user.id }
        });

        res.redirect("/tasks");
    } catch (err) {
        console.log(err);
        res.send("Error deleting task");
    }
});

router.post("/status/:id", requireLogin, async (req, res) => {
    try {
        await Task.update(
            { status: req.body.status },
            { where: { id: req.params.id, userId: req.session.user.id } }
        );

        res.redirect("/tasks");
    } catch (err) {
        console.log(err);
        res.send("Error updating status");
    }
});

module.exports = router;
