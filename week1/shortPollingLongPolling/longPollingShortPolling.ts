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

app.get('/shortpoll/status', (req, res) => {
    let status = getStatusFromBackend();
    res.send({"status": status});
})

app.get('/longpoll/status', (req, res) => {
    let currentStatus = req.query.status as string;  // ✅ correct
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