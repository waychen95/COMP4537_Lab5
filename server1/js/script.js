import { MESSAGE } from "../lang/en/user.js"

class Page {

    render() {

        const API_URL = 'https://juhyunp.xyz/COMP4537/labs/5'

        document.getElementById("submit-button").innerText = MESSAGE.SUBMIT
        document.getElementById("title").innerText = MESSAGE.TITLE
        document.getElementById("query-input").setAttribute("placeholder", MESSAGE.TEXT_PLACEHOLDER)

        const default_button = document.getElementById("default-button")
        default_button.innerText = MESSAGE.DEFAULT_BUTTON

        default_button.addEventListener("click", async () => {
            const default_response = document.getElementById("default-response")
            default_response.innerHTML = ""
            try {
                const res = await fetch(`${API_URL}/api/insertPatient`)
                const data = await res.json()
                if (data) {
                    default_response.innerHTML = `<p>${MESSAGE.DEFAULT_PATIENT_SUCCESS}</p>`
                } else {
                    default_response.innerHTML = `<p>${MESSAGE.DEFAULT_PATIENT_FAIL}</p>`
                }
            } catch (err) {
                default_response.innerHTML = `<p>${err}</p>`
            }
        })

        const submit_button = document.getElementById("submit-button")
        submit_button.addEventListener("click", async () => {
            const query = document.getElementById("query-input").value.trim()
            const response = document.getElementById("query-response")
            response.innerHTML = ""

            let res, data

            if (!query) {
                alert(MESSAGE.EMPTY_QUERY_WARNING)
                return
            }

            try {
                if (query.toLowerCase().startsWith("select")) {
                    res = await fetch(`${API_URL}/api/v1/sql/${encodeURIComponent(query)}`)
                    data = await res.json()
                } else if (query.toLowerCase().startsWith("insert")) {
                    res = await fetch(`${API_URL}/api/v1/sql/${encodeURIComponent(query)}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json"},
                        body: JSON.stringify({query: query})
                    })

                    data = await res.json()
                } else {
                    alert(MESSAGE.QUERY_ALERT)
                    return
                }

                if (Array.isArray(data) && data.length > 0) {
                    data.forEach(item => {
                        const div = document.createElement("div")
                        div.classList.add("response-list")
                        const p = document.createElement("p")
                        p.classList.add("response-item")
                        p.innerText = `ID: ${item.patientId}, Name: ${item.name}, Date of Birth: ${item.dateOfBirth}`
                        div.appendChild(p)
                        response.appendChild(div)
                    })
                } else if (data.message) {
                    response.innerHTML = `<p>${data.message}</p>`
                } else {
                    response.innerText = MESSAGE.NO_DATA
                }
            } catch(err) {
                console.log(err)
                response.innerHTML = `<p>${err}</p>`
            }
        })
    }
}

window.onload = () => {
    const page = new Page()
    page.render()
}