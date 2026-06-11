-- Add DiscountAmount column to Invoices table if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Invoices' AND COLUMN_NAME = 'DiscountAmount'
)
BEGIN
    ALTER TABLE Invoices
    ADD DiscountAmount DECIMAL(18, 2) NOT NULL DEFAULT 0;
    PRINT 'Added DiscountAmount column to Invoices table';
END
ELSE
BEGIN
    PRINT 'DiscountAmount column already exists in Invoices table';
END

-- Add DiscountAmount column to InvoiceLines table if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'InvoiceLines' AND COLUMN_NAME = 'DiscountAmount'
)
BEGIN
    ALTER TABLE InvoiceLines
    ADD DiscountAmount DECIMAL(18, 2) NOT NULL DEFAULT 0;
    PRINT 'Added DiscountAmount column to InvoiceLines table';
END
ELSE
BEGIN
    PRINT 'DiscountAmount column already exists in InvoiceLines table';
END

-- Add ExpiryDate column to InvoiceLines table if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'InvoiceLines' AND COLUMN_NAME = 'ExpiryDate'
)
BEGIN
    ALTER TABLE InvoiceLines
    ADD ExpiryDate DATETIME2 NULL;
    PRINT 'Added ExpiryDate column to InvoiceLines table';
END
ELSE
BEGIN
    PRINT 'ExpiryDate column already exists in InvoiceLines table';
END
