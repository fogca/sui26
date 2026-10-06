-- Shipping-prep fields get real columns.
--
-- The STORES-style flow captures a carrier and a short message to the customer
-- alongside the tracking number, and both need to survive as order data (they
-- belong on the packing slip and in any future notification mail). They were
-- briefly parked in activity_log JSON; this promotes them to first-class
-- columns so reads are a plain SELECT rather than "latest matching log row".
ALTER TABLE orders ADD COLUMN carrier TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN ship_message TEXT NOT NULL DEFAULT '';
