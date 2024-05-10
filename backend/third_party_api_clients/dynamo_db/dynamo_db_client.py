import boto3
import os

class DynamoDBClient:
    """
    A singleton class representing DynamoDB third-party API client.

    This class is designed to provide a single instance of the DynamoDB's API client
    to avoid unnecessary reinitialization.

    Example:
        Usage of the DynamoDBClient:

        ```python
        api_client = DynamoDBClient()
        ```
    """
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(DynamoDBClient, cls).__new__(cls)
            cls.client = boto3.resource(
                'dynamodb',
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                region_name="us-east-1"
            )
            

        return cls._instance



    