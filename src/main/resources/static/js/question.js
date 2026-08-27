const questionForm =
    document.getElementById("questionForm");


questionForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const token =
            localStorage.getItem("token");

        const role =
            localStorage.getItem("role");


        // ==============================
        // CHECK ADMIN
        // ==============================

        if (!token || role !== "ADMIN") {

            window.location.href =
                "admin-login.html";

            return;
        }


        // ==============================
        // GET FORM VALUES
        // ==============================

        const questionText =
            document.getElementById(
                "questionText"
            ).value.trim();

        const optionA =
            document.getElementById(
                "optionA"
            ).value.trim();

        const optionB =
            document.getElementById(
                "optionB"
            ).value.trim();

        const optionC =
            document.getElementById(
                "optionC"
            ).value.trim();

        const optionD =
            document.getElementById(
                "optionD"
            ).value.trim();

        const category =
            document.getElementById(
                "category"
            ).value;


        try {

            const response =
                await fetch(
                    "/api/admin/questions",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                "Bearer " + token

                        },

                        body:
                            JSON.stringify({

                                questionText:
                                    questionText,

                                optionA:
                                    optionA,

                                optionB:
                                    optionB,

                                optionC:
                                    optionC,

                                optionD:
                                    optionD,

                                category:
                                    category
                            })
                    }
                );


            // ==============================
            // SUCCESS
            // ==============================

            if (response.ok) {

                const data =
                    await response.json();

                showMessage(
                    "Question added successfully.",
                    "success"
                );

                questionForm.reset();

            }


            // ==============================
            // ERROR
            // ==============================

            else {

                const message =
                    await response.text();

                showMessage(
                    message ||
                    "Failed to add question.",
                    "danger"
                );
            }

        }

        catch (error) {

            console.error(error);

            showMessage(
                "Unable to connect to server.",
                "danger"
            );
        }

    }
);


// ==========================================
// SHOW MESSAGE
// ==========================================

function showMessage(
    message,
    type
) {

    const messageBox =
        document.getElementById("message");

    messageBox.className =
        "alert alert-" + type;

    messageBox.textContent =
        message;
}