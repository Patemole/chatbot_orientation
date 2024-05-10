from typing import Any, Dict, List
from third_party_api_clients.dynamo_db.dynamo_db_client import DynamoDBClient
from botocore.exceptions import ClientError
from datetime import datetime
import uuid

table = DynamoDBClient().client.Table("PROD_chat")

async def get_chat_history(chat_id):
     # Query based on the partition key
    try:
        response = table.query(
            KeyConditionExpression=f"chat_id = :value",
            ExpressionAttributeValues={':value': chat_id}
        )
        return response.get('Items', [])
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        print(f"Error querying chat history: {error_code} - {error_message}")
        return []
    
async def store_message_async(
        chat_id: str, 
        course_id: str, 
        message_body: str, 
        username: str = "TAI",
        documents: List[Dict[str, Any]]= []) :
    try:
        # Insert the item into DynamoDB
        args = {
            'message_id' : str(uuid.uuid4()),
            'chat_id': chat_id,
            'timestamp': datetime.now().isoformat(),
            'course_id' : course_id,
            'body': message_body,
            'username': username
            }
        # Add documents if present
        if (username == "TAI" and documents):
            args['documents'] = documents
        # Put Item on table
        table.put_item(Item=args)
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        print(f"Error inserting message into chat history: {error_code} - {error_message}")