let db; //create variable to hold db connection

//connect to IndexedDB called budget_log: version 1
const request = indexedDB.open('budget_log', 1);

request.onupgradeneeded = function(event) { //this event will emit if version changes
    const db = event.target.result; //save a reference to the database 

    //create an obj  called budget_log (auto increment) within the local scope
    db.createObjectStore('budget_log', { autoIncrement: true });
};

request.onsuccess = function(event) { //db successfuly connect
    db = event.target.result; //save a reference to db global variable

    //check if app is online, then run uploadSpending() to send local data to api
    if (navigator.onLine) { uploadSpending(); }
};

request.onerror = function(event) { //upon error, console log the error here
    console.log(event.target.errorCode);
};

//execute if attempt to add new spending log but there is no internet connection
function saveRecord(record) {

    // open a new transaction with the db with read and write permissions 
    const transaction = db.transaction(['budget_log'], 'readwrite');

    // access the object store for `new_budget`
    const budgetObjectStore = transaction.objectStore('new_budget');

    budgetObjectStore.add(record); //add record to your store with add method
}

function uploadSpending() {


    const transaction = db.transaction(['new_budget'], 'readwrite'); //open transaction on db

    // access your object store
    const budgetObjectStore = transaction.objectStore('new_budget');

    // get all records from store and set to a variable
    const getAll = budgerObjectStore.getAll();

    getAll.onsuccess = function() { //if successful, .getAll() execution
        if (getAll.result.length > 0) { //if data stored in indexedDB, sent it to api server
            fetch('/api/budgets', {
                    method: 'POST',
                    body: JSON.stringify(getAll.result),
                    headers: {
                        Accept: 'application/json, text/plain, */*',
                        'Content-Type': 'application/json'
                    }
                }).then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) { throw new Error(serverResponse); }

                    const transaction = db.transaction(['new_budget'], 'readwrite');
                    const budgetObjectStore = transaction.objectStore('new_budget');
                    budgetObjectStore.clear();

                    alert('All saved budget has been submitted!');
                }).catch(err => { console.log(err); });
        }
    };
}

window.addEventListener('online', uploadSpending); //listen to app, get back online