module.exports = func => { //func is what we pass in
    return (req, res, next) => { //it returns a new function
        func(req, res, next).catch(next); //that has func executed and catches any errors and passes the to next
    }
}