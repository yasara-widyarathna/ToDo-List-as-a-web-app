// Authentication Functions

// Email validation function
function isValidEmail(email) {
    // Regular expression for email validation
    var emailPattern = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
    return emailPattern.test(email);
}



// Sign up function with email validation
function signUp() {
    var email = document.getElementById("signup-email").value;
    var password = document.getElementById("signup-password").value;
    var confirmPassword = document.getElementById("confirm-password").value;

    if (!isValidEmail(email)) {
        swal("Error", "Please enter a valid email address.", "error");
        return;
    }

    if (password !== confirmPassword) {
        swal("Error", "Passwords do not match.", "error");
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("User signed up:", userCredential.user);
            swal("Success", "Sign up successful!", "success");
            fetchTasks(); // Fetch tasks after sign up
            

            // Clear input fields
            document.getElementById("signup-email").value = "";
            document.getElementById("signup-password").value = "";
            document.getElementById("confirm-password").value = "";
        })
        .catch((error) => {
            console.error("Sign up error:", error);
            swal("Error", "Sign up failed","error");
        });
} 
// Login function with email validation
function login() {
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;

    if (!isValidEmail(email)) {
        swal("Error", "Please enter a valid email address.", "error");
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("User logged in:", userCredential.user);
            swal("Success", "Login successful!", "success");
            fetchTasks(); // Fetch tasks after login
            

            // Clear input fields
            document.getElementById("email").value = "";
            document.getElementById("password").value = "";
        })
        .catch((error) => {
            console.error("Login error:", error);
            swal("Error", "Login failed: " + error.message, "error");
        });
}


// Logout function
function logout() {
    auth.signOut().then(() => {
        console.log("User signed out");
        swal("success","Logout successful!","success"); // Show success message
        document.getElementById("taskList").innerHTML = ""; // Clear tasks on logout
    }).catch((error) => {
        console.error("Logout error:", error);
        swal("Error","Logout failed!", "error"); // Show error message
    });
}

// Event listeners for forms
document.getElementById("signup-form").addEventListener("submit", function(event) {
    event.preventDefault();
    signUp();
});

document.getElementById("login-form").addEventListener("submit", function(event) {
    event.preventDefault();
    login();
});

// Task Management Functions

// Add Task
function addTask() {
    var user = auth.currentUser;
    if (!user) {
        console.error("User not authenticated.");
        swal("Error","Please log in to add tasks.", "error"); // Show error message
        return;
    }

    var taskInput = document.getElementById("taskInput").value;
    var dueDateInput = document.getElementById("dueDateInput").value;
    var categoryInput = document.getElementById("categoryInput").value;

    if (taskInput.trim() === "") {
        swal("warning","Please enter a task.", "warning");
        return;
    }

    var task = {
        text: taskInput,
        dueDate: dueDateInput,
        category: categoryInput,
        done: false,
        userId: user.uid // Associate task with user
    };

    db.collection("tasks").add(task)
        .then(() => {
            console.log("Task added successfully.");
            swal("success","Task added successfully!", "success"); // Show success message
            document.getElementById("taskInput").value = "";
            document.getElementById("dueDateInput").value = "";
            document.getElementById("categoryInput").value = "";
            fetchTasks(); // Refresh tasks after adding
        })
        .catch((error) => {
            console.error("Error adding task:", error);
            swal("error", "Error adding task", "Error"); // Show error message
        });
}

// Fetch Tasks
function fetchTasks() {
    var user = auth.currentUser;
    if (!user) {
        console.error("User not authenticated.");
        return;
    }

    var taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    db.collection("tasks").where("userId", "==", user.uid).get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                var task = doc.data();
                var li = document.createElement("li");
                li.classList.add("task-item");

                var taskText = document.createElement("span");
                taskText.classList.add("task-text");
                taskText.textContent = task.text;
                li.appendChild(taskText);

                if (task.dueDate) {
                    var taskDueDate = document.createElement("span");
                    taskDueDate.classList.add("task-due-date");
                    taskDueDate.textContent = "Due: " + task.dueDate;
                    li.appendChild(taskDueDate);
                }

                if (task.category) {
                    var taskCategory = document.createElement("span");
                    taskCategory.classList.add("task-category");
                    taskCategory.textContent = "Category: " + task.category;
                    li.appendChild(taskCategory);
                }

                var buttonGroup = document.createElement("div");
                buttonGroup.classList.add("button-group");

                var doneBtn = document.createElement("button");
                var doneImg = document.createElement("img");
                doneImg.src = "done.png";
                doneImg.alt = "Done";
                doneBtn.appendChild(doneImg);
                doneBtn.onclick = function() {
                    li.classList.toggle("done");
                    db.collection("tasks").doc(doc.id).update({ done: !task.done });
                };
                buttonGroup.appendChild(doneBtn);

                var removeBtn = document.createElement("button");
                var removeImg = document.createElement("img");
                removeImg.src = "remove.webp";
                removeImg.alt = "Remove";
                removeBtn.appendChild(removeImg);
                removeBtn.onclick = function() {
                    li.remove();
                    db.collection("tasks").doc(doc.id).delete(); // Delete from Firestore
                };
                buttonGroup.appendChild(removeBtn);

                li.appendChild(buttonGroup);
                taskList.appendChild(li);

                if (task.done) {
                    li.classList.add("done");
                }
            });
        })
        .catch((error) => {
            console.error("Error fetching tasks:", error);
            swal("error", "Error fetching task", "Error"); // Show error message
        });
}

// Clear All Tasks
function clearAll() {
    var user = auth.currentUser;
    if (!user) {
        console.error("User not authenticated.");
        swal("Error", "Please log in to clear tasks.","error"); // Show error message
        return;
    }

    db.collection("tasks").where("userId", "==", user.uid).get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                db.collection("tasks").doc(doc.id).delete();
            });
        })
        .then(() => {
            console.log("All tasks cleared successfully.");
            swal("success", "All tasks cleared successfully!", "success"); // Show success message
            fetchTasks(); // Refresh tasks after clearing
        })
        .catch((error) => {
            console.error("Error clearing tasks:", error);
            swal("Error", "Error clearing tasks", "error"); // Show error message
        });
}

// Filter Tasks
function filterTasks() {
    var searchInput = document.getElementById("searchInput").value.toLowerCase();
    var tasks = document.getElementById("taskList").getElementsByTagName("li");

    for (var i = 0; i < tasks.length; i++) {
        var taskText = tasks[i].getElementsByClassName("task-text")[0].textContent.toLowerCase();
        var taskDueDate = tasks[i].getElementsByClassName("task-due-date")[0]?.textContent.toLowerCase() || '';
        var taskCategory = tasks[i].getElementsByClassName("task-category")[0]?.textContent.toLowerCase() || '';

        if (taskText.includes(searchInput) || taskDueDate.includes(searchInput) || taskCategory.includes(searchInput)) {
            tasks[i].style.display = "";
        } else {
            tasks[i].style.display = "none";
        }
    }
}

// Real-time Authentication State Listener
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User is logged in:", user);
        fetchTasks(); // Fetch tasks for logged-in user
    } else {
        console.log("No user is logged in.");
        
    }
});

// Toggle UI based on authentication state
function toggleAuthUI(showAuth) {
    document.getElementById("container").style.display = showAuth ? "block" : "none";
    document.getElementById("todo-container").style.display = showAuth ? "none" : "block";
    document.getElementById("logout-button").style.display = showAuth ? "none" : "block";
}
