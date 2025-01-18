| table_name  | column_name       | data_type                |
| ----------- | ----------------- | ------------------------ |
| cart_items  | id                | uuid                     |
| cart_items  | user_id           | uuid                     |
| cart_items  | product_id        | uuid                     |
| cart_items  | quantity          | integer                  |
| cart_items  | created_at        | timestamp with time zone |
| order_items | id                | uuid                     |
| order_items | order_id          | uuid                     |
| order_items | product_id        | uuid                     |
| order_items | quantity          | integer                  |
| order_items | price             | numeric                  |
| order_items | numbers           | ARRAY                    |
| order_items | created_at        | timestamp with time zone |
| orders      | id                | uuid                     |
| orders      | user_id           | uuid                     |
| orders      | ref               | character varying        |
| orders      | status            | character varying        |
| orders      | payment_method    | character varying        |
| orders      | total             | numeric                  |
| orders      | created_at        | timestamp with time zone |
| orders      | payment_id        | character varying        |
| orders      | payment_status    | character varying        |
| orders      | pix_code          | text                     |
| orders      | pix_qrcode        | text                     |
| orders      | paid_at           | timestamp with time zone |
| orders      | email             | character varying        |
| orders      | quantity          | integer                  |
| orders      | notes             | text                     |
| raffles     | product_id        | uuid                     |
| raffles     | name              | character varying        |
| raffles     | description       | text                     |
| raffles     | price             | numeric                  |
| raffles     | image_url         | text                     |
| raffles     | cotas_total       | integer                  |
| raffles     | cotas_disponiveis | integer                  |
| raffles     | cotas_reservadas  | integer                  |
| raffles     | cotas_vendidas    | integer                  |
| raffles     | status            | character varying        |
| raffles     | draw_date         | timestamp with time zone |
| raffles     | created_at        | timestamp with time zone |
| users       | id                | uuid                     |
| users       | phone             | character varying        |
| users       | email             | character varying        |
| users       | name              | character varying        |
| users       | cpf               | character varying        |
| users       | created_at        | timestamp with time zone |
| winners     | id                | uuid                     |
| winners     | raffle_id         | uuid                     |
| winners     | user_id           | uuid                     |
| winners     | order_item_id     | uuid                     |
| winners     | winning_number    | character varying        |
| winners     | draw_date         | timestamp with time zone |
| winners     | created_at        | timestamp with time zone |
