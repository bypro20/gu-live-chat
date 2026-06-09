package org.guchat.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        if (this.bridge == null) return;
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            String ua = webView.getSettings().getUserAgentString();
            webView.getSettings().setUserAgentString(ua + " GuChatApp/1.0");
        }
    }
}
