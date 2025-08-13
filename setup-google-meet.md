# Google Meet Integration Setup Guide

## 🚀 **Quick Setup for Real Google Meet Links**

### **Step 1: Add NODE_OPTIONS to your environment**

Add this line to your `.env.local` file (create it if it doesn't exist):

```env
NODE_OPTIONS=--openssl-legacy-provider
```

### **Step 2: Verify your Google Service Account credentials**

Make sure these are in your `.env.local`:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=tutorconnect-meet@tutor2-468616.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCm5TJ7QavIIQfT\nLlqRPyFNOri5joAx6E/omPtnbgqpiaOQg0m0oFeXjAj7C64pRtgNHHp7sbc+Dt1P\nrNQM4TTzM4MQFlyjdXvXDOrYrnQS8xqsdw9v8ZGMZHgXxnk8di5CazqAXzawLvv3\nmu2BKqTDRmrE9rL4kijVtm7aupnjQ+PYJzaFjxZulhum/FQ6NrVUvk4oZxtZS0lG\ngqeNADCYbqcRbHdoBWcq0NLoNhT1pnP52IbdGo7EYNMl6Zst+Ax4qJFV8lihu4rO\nUvb2cNGEPIOJG7zyQoNNxGE00F6MFsD8msG7ZicwkSh1NC2OD5LQOZ5P1Ke8X4N5\nJSvfdnBvAgMBAAECggEASSrHMGEwicrtTsiOHQpDs8NwM61FB1w1GCBla0lDdGMq\nqZLdL8pxzDcwwrqyrlboJgtbqTnWv2at4J3A0yqyV4K4TUe4clLxqWx40ujca2hX\nw89onaeWqylquuWgxgB7tFOlMJ1NcP0QKtOplwyWciO/cD1FZhNRwqu5uru+9nJZ\n+Z6kM9Pw6MbTsPwht70vsnTEpObXyiOZg5a4QYX2CcrUg8aTQOEpPTRX8tmc902r\nlQEu6GWE9kLCyDA2BqIC0RQRt8XBJXnoxt0zQ+wo2CRZVvuFp1AxrkjHL1A56WDf\n9Dcjarioo0NXrczeewC4bBT6RhCnZ5b5vkVJHJ1YFQKBgQDa9Ra56se1xqQdfvIG\nLB2uSZEvnB3bIAoFe48rbGYFs0kQfbDIK31imOcQPg+yVryb/0OKTtE/7USaqSNG\nIlA59ZKS2gtiEJ35c+43qsE2cIGYFFqYCP6B8w2tPTq1wQsuQuHAnP3v1rCLqFbJ\nfxneM5ISk5mmzGqVZSYy4uoPvQKBgQDDIVTa+dtlepmK7tNj6H+B49/K082SohZl\npRugTNR2Elgp3T62Ih0az4xBs+7C4IoY0gVbWFGSxc8wK5hU/lNkDZAeElcbLSOy\nFzvoIAAg1SBOxztbrIyb8KO4aHHn2CrN8g5LgX7UzUR/3jHKAjwBuLaVODy4GGID\nXdaJBfidmwKBgALDUv0XnFuL3ShOIMm5Jsq7POzH4IySU+4LyBu5K3Ro9cQSgfeU\nrOlgmpHW5qXOeGTTjMujAPr4iIQXHE3XQwHoOmhF/hzHrual8tya+AMy2j/MCfSf\nMG79XS/RdPs0K2rzBxxCHuY25FVu02GJjA8EwZQgbrDvJW0rMJc1y9RVAoGBAJdC\nFTcRi+KkILWz4CWIKp8Td30QpkBOaTItxLaEGAXWvoTlPiGNXCZWUJD129UwnZwT\n4ZcnZURzFeJvSMxJwXbDlL3a1a75VLxOil+rvq20yDCI/BhaLz0KUr82J2XjCXtP\ncYlSPnDTFZBROyMujDmBZ/dP+rFyJTga25yoBkqVAoGBAJF6GDZPKHlvme08pk4x\n51h9a3a3vIBWJz/rf1fWO7i0CjpYvO4eHoxbnSgnjwBS8T+LVxwB0ON0V5GfeHMN\njHUi5QkZPcbahbtz+gH6vIFWCuYWdp54gHGabdZX1vbllt8271TyGDHB1RuDvCad\n5uMSjzXuSrYTB3wV0+rfYZwe\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=tutor2-468616
```

### **Step 3: Restart your development server**

```bash
npm run dev
```

### **Step 4: Test the integration**

1. Go to your student dashboard
2. Click "🔧 Test Google Meet API" button
3. Check the console for detailed logs

## 🎯 **What This Fixes**

### **✅ OpenSSL Issue Fixed**
- Uses `google.auth.JWT` instead of `GoogleAuth`
- Adds `NODE_OPTIONS=--openssl-legacy-provider`
- Proper private key formatting

### **✅ Real Google Meet Links**
- Creates actual Google Calendar events
- Generates real `hangoutLink` URLs
- No more "verify your meeting code" errors

### **✅ Better Error Handling**
- Graceful fallback if API fails
- Detailed logging for debugging
- Meaningful error messages

## 🧪 **Testing**

After setup, you should see:

```
✅ Real Google Meet link created: https://meet.google.com/abc-defg-hij
```

Instead of:

```
❌ Google Calendar API authentication failed: Error: error:1E08010C:DECODER routines::unsupported
```

## 🚀 **Next Steps**

1. Add the `NODE_OPTIONS` line to your `.env.local`
2. Restart your development server
3. Test the Google Meet API button
4. Try the 1-minute reminder feature

The links should now be **real, functional Google Meet URLs** that actually work!
