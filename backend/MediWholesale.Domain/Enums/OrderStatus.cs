namespace MediWholesale.Domain.Enums;

public enum OrderStatus
{
    Pending = 1,
    Confirmed = 2,
    PartiallyDispatched = 3,
    Completed = 4,
    Cancelled = 5,
    Dispatched = 6
}
