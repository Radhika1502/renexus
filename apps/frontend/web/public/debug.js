console.log('Debug script loaded');

// Override console.error to make errors more visible
const originalError = console.error;
console.error = function() {
    document.body.innerHTML += <div style="position:fixed;bottom:10px;left:10px;background:red;color:white;padding:10px;z-index:10000;max-width:80%;">Error: \</div>;
    originalError.apply(console, arguments);
};

// Add window error handler
window.addEventListener('error', function(e) {
    document.body.innerHTML += <div style="position:fixed;top:10px;left:10px;background:red;color:white;padding:10px;z-index:10000;max-width:80%;">JS Error: \</div>;
    return false;
});

// Check if React is loading
setTimeout(() => {
    if (!window.React) {
        document.body.innerHTML += <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:orange;color:black;padding:20px;z-index:10000;">React not loaded properly</div>;
    }
}, 2000);
