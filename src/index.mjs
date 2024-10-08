import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

const tableName = "Users";

export const handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    switch (event.routeKey) {
      // Eliminar un usuario
      case "DELETE /users/{userId}":
        await dynamo.send(
          new DeleteCommand({
            TableName: tableName,
            Key: {
              userId: event.pathParameters.userId,
            },
          })
        );
        body = `Deleted user ${event.pathParameters.userId}`;
        break;

      // Obtener un usuario específico
      case "GET /users/{userId}":
        body = await dynamo.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              userId: event.pathParameters.userId,
            },
          })
        );
        body = body.Item || { message: "User not found" };
        break;

      // Obtener todos los usuarios
      case "GET /users":
        body = await dynamo.send(new ScanCommand({ TableName: tableName }));
        body = body.Items || [];
        break;

      // Crear o actualizar un usuario
      case "PUT /users":
        const requestJSON = JSON.parse(event.body);
        await dynamo.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              userId: requestJSON.userId,
              nombre: requestJSON.nombre,
              apellido: requestJSON.apellido,
              age: requestJSON.age,
              email: requestJSON.email,
            },
          })
        );
        body = `User ${requestJSON.userId} has been created/updated successfully.`;
        break;

      // Actualizar un usuario específico (actualización parcial)
      case "PATCH /users/{userId}":
        const updateJSON = JSON.parse(event.body);
        await dynamo.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { userId: event.pathParameters.userId },
            UpdateExpression:
              "set #nombre = :nombre, #apellido = :apellido, #age = :age, #email = :email",
            ExpressionAttributeNames: {
              "#nombre": "nombre",
              "#apellido": "apellido",
              "#age": "age",
              "#email": "email",
            },
            ExpressionAttributeValues: {
              ":nombre": updateJSON.nombre,
              ":apellido": updateJSON.apellido,
              ":age": updateJSON.age,
              ":email": updateJSON.email,
            },
          })
        );
        body = `User ${event.pathParameters.userId} has been updated successfully.`;
        break;

      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }
  } catch (err) {
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers,
  };
};
