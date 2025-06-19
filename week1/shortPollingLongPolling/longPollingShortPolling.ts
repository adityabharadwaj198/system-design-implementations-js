import express from 'express';
import path from 'path';

const app = express()

// Serve HTML + static files
app.use(express.static(path.join(__dirname, 'public')));

let count: number = 0; 
function incrementCounter(): void {
    setInterval(() => {
        count = count + 1;
        console.log(count);
    }, 1000);

}
function getStatusFromBackend(): string {
    if (count == 0) {
        return "STARTING";
    }
    else if (count > 0 && count <10) {
        return "IN_PROGRESS";
    }
    else {
        return "SUCCESS"
    }
}

app.get('/shortpoll/status', (req, res) => { // Shortpolling works like -> Frontend keeps calling this API and it keeps requesting status from
    // backend and just sends back the response 
    let status = getStatusFromBackend();
    res.send({"status": status});
})

app.get('/longpoll/status', (req, res) => { // long polling works like -> Frontend calls the long poll api with a status 
    // the long poll API checks status from backend periodically, and only when there is a change in the status of the API response, does it send back the response to the frontend

    /*
        It's kinda like the work of polling is transferred from frontend (in teh case of a shortpolling API) to the backend (in case of a longpolling API).
    */
    let currentStatus = req.query.status as string; 
    const check = () => {
        const newStatus = getStatusFromBackend();
        if (newStatus !== currentStatus) {
            res.send({ status: newStatus });
        } else {
            setTimeout(check, 500); // keep checking every 500ms
        }
    };

    check();
})
incrementCounter();
app.listen(3000);