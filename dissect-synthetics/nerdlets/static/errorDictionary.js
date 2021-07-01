const variableErrors = [
    {
        "message": "Error: no such element: Unable to locate element: <LOCATOR>",
        "regex": /Error: no such element: Unable to locate element:(.*)/i,
        "rLike": 'Error: no such element: Unable to locate element:(.*)'
    },
    {
        "message": "TaskTimedOut: task timed-out waiting for element to be located using: <LOCATOR>",
        "regex": /TaskTimedOut: task timed-out waiting for element to be located using:(.*)/s,
        "rLike": 'TaskTimedOut: task timed-out waiting for element to be located using:(.*)'
    },
    {
        "message": "NetworkError: Connect to (HOST) [HOST./IP ADDRESS] failed: connect timed out",
        "regex": /NetworkError: Connect to (.*) failed: connect timed out/s,
        "rLike": 'NetworkError: Connect to (.*) failed: connect timed out'
    },
    {
        "message": "NetworkError: Connect to (HOST) [HOST./IP ADDRESS] failed: Connection refused",
        "regex": /NetworkError: Connect to (.*) failed: Connection refused/s,
        "rLike": 'NetworkError: Connect to (.*) failed: Connection refused'
    },
    {
        "message": "HTTPError: Server replied with HTTP XXX response code",
        "regex": /HTTPError: Server replied with HTTP (.*) response code/s,
        "rLike": 'HTTPError: Server replied with HTTP (.*) response code'
    },
    {
        "message": "SSLVerificationError: (ERROR)",
        "regex": /SSLVerificationError:(.*)/s,
        "rLike": 'SSLVerificationError:(.*)'
    },
    {
        "message": "NetworkError: DNS resolution failed for host: (HOST)",
        "regex": /NetworkError: DNS resolution failed for host: (.*)/s,
        "rLike": 'NetworkError: DNS resolution failed for host: (.*)'
    },
    {
        "message": "BlockedRequestError: (URL)",
        "regex": /BlockedRequestError:(.*)/s,
        "rLike": 'BlockedRequestError:(.*)'
    },
    {
        "message": "AssertionError",
        "regex": /AssertionError:(.*)/s,
        "rLike": 'AssertionError:(.*)'
    }
]

export default variableErrors;